import * as crypto from "crypto";
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { PrismaService } from "src/prisma/prisma.service";


@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
    constructor(private readonly prismaService: PrismaService) {
        super();
    }

    async validate(req: Request): Promise<{ userId: string; walletAddress: string; authType: string }> {
        const apiKey = this.extractApiKey(req);

        if (!apiKey) {
            throw new UnauthorizedException('No API key provided');
        }

        const user = await this.validateApiKey(apiKey);

        if (!user) {
            throw new UnauthorizedException('Invalid API key');
        }

        return user;
    }

    private extractApiKey(req: Request): string | null {
        // Extract from header
        const headerKey = req.headers['x-api-key'] as string;
        if (headerKey) {
            return headerKey;
        }

        // Extract from query parameter (optional)
        const queryKey = req.query['api-key'] as string;
        if (queryKey) {
            return queryKey;
        }

        return null;
    }

    async validateApiKey(apiKey: string): Promise<{ userId: string; walletAddress: string; authType: string } | null> {

        const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex")
        const apiKeyRecord = await this.prismaService.aPIKey.findUnique({
            where: { key: apiKeyHash },
            include: { owner: true },
        });

        if (!apiKeyRecord) {
            return null;
        }

        return { userId: apiKeyRecord.owner.id, walletAddress: apiKeyRecord.owner.walletAddress, authType: 'api-key' };
    }
}