import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmbeddingsModule } from 'src/embeddings/embeddings.module';

@Module({
  imports: [EmbeddingsModule],
  controllers: [AgentsController],
  providers: [AgentsService, PrismaService],
  exports: [AgentsService],
})
export class AgentsModule { }
