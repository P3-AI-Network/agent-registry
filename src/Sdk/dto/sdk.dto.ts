import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from '@prisma/client';

export class VerifyDocumentDto {
  @IsString()
  @ApiPropertyOptional({
    description: 'Cred document Json of the user',
  })
  credDocumentJson?: string;
}
