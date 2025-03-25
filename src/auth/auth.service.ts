import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ethers } from "ethers";
import { createIdentity, generateSeed, seedToBase64 } from 'src/identity-wallet';


@Injectable()
export class AuthService {

    constructor(private jwtService: JwtService, private prismaService: PrismaService, private configService: ConfigService) { }

    async createConnection(userDIDIdentifier: string, userDID: string) {

        const username = this.configService.get('ISSUER_USERNAME');
        const password = this.configService.get('ISSUER_PASSWORD');
        const issuerUrl = this.configService.get('ISSUER_NODE_URL');
        const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');

        const tokenBase64 = btoa(`${username}:${password}`);

        await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/connections`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${tokenBase64}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "userDID": userDIDIdentifier,
                "userDoc": JSON.parse(userDID),
                "issuerDoc": JSON.parse(userDID)
            }),
        });

    }


    async getConnection(userDIDIdentifier: string) {

        const username = this.configService.get('ISSUER_USERNAME');
        const password = this.configService.get('ISSUER_PASSWORD');
        const issuerUrl = this.configService.get('ISSUER_NODE_URL');

        const tokenBase64 = btoa(`${username}:${password}`);


        const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');
        const resp = await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/connections?query=${userDIDIdentifier}&page=1&max_results=1`, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${tokenBase64}`,
                'Content-Type': 'application/json',
            }
        });

        if (resp.status !== 200) {
            throw new InternalServerErrorException("Issuer node Error")
        }

        const data = await resp.json();

        return data.items[0].id
    }

    async issueCredential(userDIDIdentifier: string) {

        const username = this.configService.get('ISSUER_USERNAME');
        const password = this.configService.get('ISSUER_PASSWORD');
        const issuerUrl = this.configService.get('ISSUER_NODE_URL');
        const userIdentitySchemaUrl = this.configService.get('USER_IDENTITY_SCHEMA_URL');
        const tokenBase64 = btoa(`${username}:${password}`);
        
        const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
        
        const bodyData = {
            credentialSchema: userIdentitySchemaUrl,
            credentialSubject: {
                id: userDIDIdentifier,
                owner: userDIDIdentifier
            },
            expiration: oneYearFromNow,
            proofs: ["Iden3SparseMerkleTreeProof", "BJJSignature2021"],
            refreshService: null,
            type: "Identity"
        };
        
        
        const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');
        
        const resp = await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/credentials`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${tokenBase64}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });

        const data = await resp.json()
        console.log(data)
        console.log(resp.status)
        if (resp.status !== 201) {
            throw new InternalServerErrorException("Issuer node Error")
        }

    }

    async login(wallet_address: string, signature: string, message: string): Promise<{ access_token: string }> {
        try {
            const msgHash = ethers.hashMessage(message);
            const recoveredAddress = ethers.recoverAddress(msgHash, signature);

            if (recoveredAddress !== wallet_address) {
                throw new BadRequestException("Invalid signature!");
            }
        } catch (err) {
            throw new BadRequestException(err.message);
        }

        let user = await this.prismaService.user.findUnique({
            where: { walletAddress: wallet_address }
        });

        if (!user) {
            let newSeed = generateSeed();
            let newIdentity = await createIdentity(newSeed);

            try {
                // Start Prisma transaction
                user = await this.prismaService.$transaction(async (tx) => {
                    const createdUser = await tx.user.create({
                        data: {
                            walletAddress: wallet_address,
                            didIdentifier: newIdentity.identifier,
                            did: newIdentity.did,
                            seed: seedToBase64(newSeed)
                        }
                    });

                    await this.createConnection(createdUser.didIdentifier, createdUser.did);
                    const connectionId = await this.getConnection(createdUser.didIdentifier);

                    await tx.user.update({
                        where: { id: createdUser.id },
                        data: { connectionString: connectionId }
                    });
                    
                    return createdUser;
                });
                
                await this.issueCredential(user.didIdentifier);
                // Issue credential (external call, so wrap in try-catch)
            } catch (err) {
                // Rollback: If any external call fails, delete the user to maintain atomicity
                await this.prismaService.user.delete({
                    where: { walletAddress: wallet_address }
                });
                throw new BadRequestException("Failed to create user identity: " + err.message);
            }
        }

        // Generate JWT
        const issuedAt = Math.floor(Date.now() / 1000);
        const jwtPayload = {
            walletAddress: user.walletAddress,
            userId: user.id,
            iat: issuedAt,
        };

        const access_token = this.jwtService.sign(jwtPayload, {
            expiresIn: this.configService.get("JWT_TOKEN_EXPIRY", "1d")
        });

        return { access_token };
    }


}
