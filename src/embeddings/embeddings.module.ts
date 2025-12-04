import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmbeddingsService } from 'src/embeddings/embeddings.service';

@Module({
  providers: [EmbeddingsService, PrismaService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
