import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";



@Injectable()
export class SdkService {
  constructor(private configService: ConfigService) { }

  async verifyAgent(credDocument: string) {
  
      const username = this.configService.get('ISSUER_USERNAME');
      const password = this.configService.get('ISSUER_PASSWORD');
      const issuerUrl = this.configService.get('ISSUER_NODE_URL');
      const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');
  
      const tokenBase64 = btoa(`${username}:${password}`);
  
      const credJson = JSON.parse(credDocument);
      const userDid = credJson.vc.credentialSubject.id;


      const resp = await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/credentials?page=1&credentialSubject=${userDid}&max_results=2`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${tokenBase64}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (resp.status !== 200) {
        throw new InternalServerErrorException("Issuer node Error")
      }
      
      const jsn: any = await resp.json();
      const data: object[] = jsn.items;
      
      if (data.length === 0) {
        return false;
      }

      const found = data.find(item => JSON.stringify(item) === JSON.stringify(credJson))

      if (!found) {
        return false;
      }
      
      return true;
    }
}

// http://localhost:3001/v2/identities/did%3Aiden3%3Apolygon%3Aamoy%3Ax9zgicedG3LJBwqk9xNGakSHxnNUSzAWWgkV267Gu/credentials?page=1&credentialSubject=did%3Apolygonid%3Apolygon%3Aamoy%3A2qWWPxk93RW4nU7oLWbzhJHhLiBn5KWnnDPCZDydWj&max_results=50