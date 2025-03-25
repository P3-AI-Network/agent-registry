import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}


  async getCredentials(userDIDIdentifier: string) {
  
          const username = this.configService.get('ISSUER_USERNAME');
          const password = this.configService.get('ISSUER_PASSWORD');
          const issuerUrl = this.configService.get('ISSUER_NODE_URL');
  
          const tokenBase64 = btoa(`${username}:${password}`);
  
  
          const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');
          const resp = await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/connections?query=${userDIDIdentifier}&page=1&max_results=1&credentials=true`, {
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
  
          return data.items[0].credentials
      }

  async getUser(userId: string): Promise<any> {

    try {

      const user = await this.prisma.user.findFirst({
        where: {
          id: userId
        }
      })
      
      if (!user) {
        throw new NotFoundException("User Not found")
      }
      
      const credentials = await this.getCredentials(user.didIdentifier);

      return {
        user,
        credentials
      };

    } catch {
      throw new NotFoundException("User Not found")
    }

  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const signersAddress = ethers.verifyMessage(
        createUserDto.message,
        createUserDto.signature,
      );

      if (
        signersAddress.toLocaleLowerCase() !==
        createUserDto.walletAddress.toLocaleLowerCase()
      ) {
        throw new BadRequestException('Invalid signature');
      }

      // Create a new DID pegged with the wallet address
      const username = this.configService.get('ISSUER_USERNAME');
      const password = this.configService.get('ISSUER_PASSWORD');
      const issuerUrl = this.configService.get('ISSUER_NODE_URL');
      console.log(username, password, issuerUrl);
      const tokenBase64 = btoa(`${username}:${password}`);
      const response = await fetch(`${issuerUrl}/v2/identities`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${tokenBase64}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          didMetadata: {
            method: 'polygonid',
            blockchain: 'polygon',
            network: 'amoy',
            type: 'BJJ',
          },
          credentialStatusType: 'Iden3ReverseSparseMerkleTreeProof',
          displayName: signersAddress,
        }),
      });

      const responseJsn = await response.json();

      if (response.status === 409) {
        throw new BadRequestException(`DID already Exists`);
      }

      if (response.status !== 201) {
        throw new BadRequestException(
          `Failed to create DID, Error: ${responseJsn.message}`,
        );
      }

      return this.prisma.user.create({
        data: {
          walletAddress: signersAddress,
          name: createUserDto.name,
          did: JSON.stringify(responseJsn),
          didIdentifier: responseJsn.identifier,
          seed: ""
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
