import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { AgentsModule } from 'src/agents/agents.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmbeddingsModule } from 'src/embeddings/embeddings.module';

@Module({
  imports: [AgentsModule, EmbeddingsModule],
  controllers: [SearchController],
  providers: [SearchService, PrismaService],
})
export class SearchModule {}
