import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from '@prisma/client';

export class CreateAgentDto {

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Name of the agent' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Description of the agent' })
  description?: string;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'JSON object describing agent capabilities',
    example: {
      ai: ['nlp', 'vision'],
      integration: ['slack', 'discord'],
      protocols: ['http', 'grpc'],
    },
  })
  capabilities?: Record<string, any>;

  @IsEnum(AgentStatus)
  @IsOptional()
  @ApiPropertyOptional({
    enum: AgentStatus,
    description: 'Current status of the agent',
    default: AgentStatus.ACTIVE,
  })
  status?: AgentStatus;

}
