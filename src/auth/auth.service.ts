import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ethers } from "ethers";
import { createIdentity, generateSeed, seedToBase64 } from 'src/identity-wallet';


@Injectable()
export class AuthService {

    constructor(private jwtService: JwtService, private prismaService: PrismaService, private configService: ConfigService) { }

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
            where: {
                walletAddress: wallet_address
            }
        })

        if (!user) {

            let newSeed = generateSeed();
            let newIdentity = await createIdentity(newSeed);

            user = await this.prismaService.user.create({
                data: {
                    walletAddress: wallet_address,
                    didIdentifier: newIdentity.identifier,
                    did: newIdentity.did,
                    seed: seedToBase64(newSeed)
                }
            })
        }

        const issuedAt = Math.floor(Date.now() / 1000);

        const jwtPayload = {
            walletAddress: user.walletAddress,
            userId: user.id,
            iat: issuedAt,
        };

        const access_token = this.jwtService.sign(jwtPayload, { expiresIn: this.configService.get("JWT_TOKEN_EXPIRY", "1d") });

        return { access_token }

    }


}
