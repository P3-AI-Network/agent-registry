import { Module } from '@nestjs/common';
import { UtilsController } from './utils.controller';
import { UtilsService } from './utils.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [UtilsController],
  providers: [UtilsService, PrismaService]
})
export class UtilsModule {}
