import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Agent } from '@prisma/client';

@ApiTags('search')
@Controller('agents/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search for agents by capabilities and keywords' })
  @ApiResponse({
    status: 200,
    description: 'List of matching agents',
    type: Object,
  })
  async searchAgents(@Query() query: SearchQueryDto): Promise<{
    data: Agent[];
    count: number;
    total: number;
  }> {
    return this.searchService.searchAgents(query);
  }
}
