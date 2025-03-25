import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsArray } from 'class-validator';



export class LoginDto {


    @IsString()
    @ApiPropertyOptional({
        description: 'Wallet address of user',
        example: "0xd5148b96d3F6F3234721C72EC8a57a4B07A45ca7"
    })
    wallet_address: string

    @IsString()
    @ApiPropertyOptional({
        description: 'message string for which signature is generated',
        example: "This is P3AI."
    })
    message: string;

    @IsString()
    @ApiPropertyOptional({
        description: 'message signature',
        example: "0x0e080fb80b13f8ac19f400588441d3605bff5e8cf6628cfa2dafd3a2068d7b33006818f4db02bfef783e9a2cead889a5cb5d4c398b049ef8b6c2fbea393dbffa1c"
    })
    signature: string;

}