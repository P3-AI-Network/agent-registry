import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JWTStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "supersecret",
      signOptions: {expiresIn: process.env.JWT_TOKEN_EXPIRY || "2000"}
    })
  ],
  providers: [AuthService, JWTStrategy, PrismaService],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
