import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetadataVisibility } from '@prisma/client';

export class CreateMetadataDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Metadata key' })
  key: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Metadata value' })
  value: string;

  @IsEnum(MetadataVisibility)
  @IsOptional()
  @ApiPropertyOptional({
    enum: MetadataVisibility,
    description: 'Visibility of the metadata',
    default: MetadataVisibility.PUBLIC,
  })
  visibility?: MetadataVisibility;
}
