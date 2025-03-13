import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from '@prisma/client';

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by keyword (case-insensitive, partial match)',
    example: 'assistant',
  })
  keyword?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    return typeof value === 'string' ? value.split(',') : value;
  })
  @ApiPropertyOptional({
    description: 'Filter by capabilities (comma separated)',
    example: 'nlp,vision',
    type: [String],
  })
  capabilities?: string[];

  @IsOptional()
  @IsEnum(AgentStatus)
  @ApiPropertyOptional({
    enum: AgentStatus,
    description: 'Filter by agent status',
    default: AgentStatus.ACTIVE,
  })
  status?: AgentStatus = AgentStatus.ACTIVE;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'The number of items to return',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'The number of items to skip',
    default: 0,
    minimum: 0,
  })
  offset?: number = 0;
}
