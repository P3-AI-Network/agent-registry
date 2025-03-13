import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { AgentsModule } from '../agents/agents.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [AgentsModule],
  controllers: [SearchController],
  providers: [SearchService, PrismaService],
})
export class SearchModule {}
