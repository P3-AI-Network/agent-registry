import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetadataVisibility } from '@prisma/client';

export class UpdateMetadataDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Metadata value' })
  value: string;

  @IsEnum(MetadataVisibility)
  @IsOptional()
  @ApiPropertyOptional({
    enum: MetadataVisibility,
    description: 'Visibility of the metadata',
  })
  visibility?: MetadataVisibility;
}
