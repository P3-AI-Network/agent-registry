import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { AgentsModule } from '../agents/agents.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [AgentsModule],
  controllers: [MetadataController],
  providers: [MetadataService, PrismaService],
  exports: [MetadataService],
})
export class MetadataModule {}
