import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"


export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    @ApiProperty({description: 'Wallet address of the user', example: "0x81C157Bc3995Ff7BFC2Aa623F2e9923DBEc44544"})
    walletAddress: string;
    @IsString()
    @IsNotEmpty()
    @ApiProperty({description: 'Signature of the user', example: "0x5d4ec066d6c6088da7b547de76277134cdbde9e49f48ade1eca05ce240d14f620c0af9c89ac5fe9f309df2661a00fbaf5b2d80db172242bf36b0eebddc6108921c"})
    signature: string

    @IsString()
    @IsNotEmpty()   
    @ApiProperty({description: 'Joining P3AI!', example: "Joining P3AI!"})
    message: string

    @IsString()
    @IsNotEmpty()
    @ApiProperty({description: 'Name of the user', example: "John Doe"})
    name: string


}