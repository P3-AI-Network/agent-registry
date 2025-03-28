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

    // For simpler keyword-only searches, use Prisma's query builder
    if ((!capabilities || capabilities.length === 0) && keyword) {
      return this.searchByKeyword(keyword, status, limit, offset);
    }

    // For capability searches, use a different approach
    return this.searchWithCapabilities(keyword, capabilities, status, limit, offset);
  }

  /**
   * Search by keyword only using Prisma's query builder
   */
  private async searchByKeyword(
    keyword?: string,
    status?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    data: Agent[];
    count: number;
    total: number;
  }> {
    const where: Prisma.AgentWhereInput = {};

    if (status) {
      where.status = status as any;
    }

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

  /**
   * Search with capabilities using PostgreSQL's JSON operators
   */
  private async searchWithCapabilities(
    keyword?: string,
    capabilities?: string[],
    status?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    data: Agent[];
    count: number;
    total: number;
  }> {
    // We'll directly query the database using Prisma's $queryRaw
    let sql = `
      WITH matching_agents AS (
        SELECT a.*
        FROM "agents" AS a
        WHERE 1=1
    `;

    // Add status filter if needed
    if (status) {
      sql += ` AND a.status = '${status}'`;
    }

    // Add capabilities filter
    if (capabilities && capabilities.length > 0) {
      const capConditions = capabilities.map(cap => 
        `jsonb_path_exists(a.capabilities::jsonb, '$.ai[*] ? (@ == "${cap}")') OR 
         jsonb_path_exists(a.capabilities::jsonb, '$.protocols[*] ? (@ == "${cap}")') OR 
         jsonb_path_exists(a.capabilities::jsonb, '$.integration[*] ? (@ == "${cap}")')`
      );
      
      sql += ` AND (${capConditions.join(' OR ')})`;
    }

    // Add keyword search if needed
    if (keyword) {
      sql += ` AND (
        a.name ILIKE '%${keyword}%' OR 
        a.description ILIKE '%${keyword}%' OR
        EXISTS (
          SELECT 1 FROM "agent_metadata" am 
          WHERE am."agentId" = a.id 
          AND am.visibility = 'PUBLIC' 
          AND am.value ILIKE '%${keyword}%'
        )
      )`;
    }

    // Close the CTE and add the main query with pagination
    sql += `
      )
      SELECT 
        a.*,
        (
          SELECT jsonb_agg(json_build_object(
            'id', am.id,
            'agentId', am."agentId",
            'key', am.key,
            'value', am.value,
            'visibility', am.visibility,
            'createdAt', am."createdAt",
            'updatedAt', am."updatedAt"
          ))
          FROM "agent_metadata" am
          WHERE am."agentId" = a.id
          AND am.visibility = 'PUBLIC'
        ) as metadata
      FROM matching_agents a
      ORDER BY a."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;


    // Execute the query
    const data = await this.prisma.$queryRawUnsafe<any[]>(sql);
    
    // Format the result
    const formattedData = data.map(item => {
      return {
        ...item,
        metadata: item.metadata || []
      };
    });

    // Count the total number of matching records
    let countSql = `
      SELECT COUNT(*) FROM (
        SELECT a.id
        FROM "agents" AS a
        WHERE 1=1
    `;

    // Add the same conditions as in the main query
    if (status) {
      countSql += ` AND a.status = '${status}'`;
    }

    if (capabilities && capabilities.length > 0) {
      const capConditions = capabilities.map(cap => 
        `jsonb_path_exists(a.capabilities::jsonb, '$.ai[*] ? (@ == "${cap}")') OR 
         jsonb_path_exists(a.capabilities::jsonb, '$.protocols[*] ? (@ == "${cap}")') OR 
         jsonb_path_exists(a.capabilities::jsonb, '$.integration[*] ? (@ == "${cap}")')`
      );
      
      countSql += ` AND (${capConditions.join(' OR ')})`;
    }

    if (keyword) {
      countSql += ` AND (
        a.name ILIKE '%${keyword}%' OR 
        a.description ILIKE '%${keyword}%' OR
        EXISTS (
          SELECT 1 FROM "agent_metadata" am 
          WHERE am."agentId" = a.id 
          AND am.visibility = 'PUBLIC' 
          AND am.value ILIKE '%${keyword}%'
        )
      )`;
    }

    countSql += `) as count_subquery`;

    // Execute the count query
    const countResult = await this.prisma.$queryRawUnsafe<[{count: string}]>(countSql);
    const total = parseInt(countResult[0].count);

    return {
      data: formattedData,
      count: formattedData.length,
      total,
    };
  }
}