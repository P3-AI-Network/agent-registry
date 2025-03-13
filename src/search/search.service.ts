import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Agent, Prisma } from '@prisma/client';
import { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search for agents by capabilities and keywords
   */
  async searchAgents(query: SearchQueryDto): Promise<{
    data: Agent[];
    count: number;
    total: number;
  }> {
    const { keyword, capabilities, status, limit = 10, offset = 0 } = query;

    // Build where conditions
    const where: Prisma.AgentWhereInput = {};

    // Default to active agents only
    where.status = status;

    // Search capabilities if specified
    if (capabilities && capabilities.length > 0) {
      where.capabilities = {
        path: capabilities.map((cap) => `$..${cap}`),
        not: {},
      };
    }

    // Search keyword in name or description (broad match)
    if (keyword) {
      where.OR = [
        {
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        // Search in metadata as well (public only)
        {
          metadata: {
            some: {
              value: {
                contains: keyword,
                mode: 'insensitive',
              },
              visibility: 'PUBLIC',
            },
          },
        },
      ];
    }

    // Execute the query with pagination
    const [data, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          metadata: {
            where: {
              visibility: 'PUBLIC',
            },
          },
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      data,
      count: data.length,
      total,
    };
  }
}
