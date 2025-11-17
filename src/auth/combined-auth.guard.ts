import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrApiKeyGuard extends AuthGuard(['api-key', 'jwt']) {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        //  try both strategies and succeed if either one passes
        return super.canActivate(context) as Promise<boolean>;
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // If user is authenticated by either strategy, allow access
        if (user) {
            return user;
        }
        
        if (err || !user) {
            throw err || new UnauthorizedException('Authentication required');
        }
        
        return user;
    }
}