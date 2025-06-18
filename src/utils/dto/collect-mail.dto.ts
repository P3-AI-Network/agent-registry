import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MailCollectorPurpose } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional } from "class-validator"

export class CollectMailDto {

    @ApiProperty({
        example: 'user@example.com',
        description: 'Email address to collect for newsletter or early access',
    })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({
        enum: MailCollectorPurpose,
        default: MailCollectorPurpose.NEWS_LETTER,
        description: 'Purpose of email collection',
    })
    @IsOptional()
    @IsEnum(MailCollectorPurpose)
    purpose?: MailCollectorPurpose = MailCollectorPurpose.NEWS_LETTER;

}