import { Module } from '@nestjs/common';
import { SdkService } from './sdk.service';
import { SdkController } from './sdk.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SdkController],
  providers: [SdkService, PrismaService],
  exports: [SdkService],
})
export class SdkModule {}
