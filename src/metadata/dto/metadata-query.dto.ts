import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MetadataVisibility } from '@prisma/client';

export class MetadataQueryDto {
  @IsEnum(MetadataVisibility)
  @IsOptional()
  @ApiPropertyOptional({
    enum: MetadataVisibility,
    description: 'Filter by visibility',
  })
  visibility?: MetadataVisibility;
}
