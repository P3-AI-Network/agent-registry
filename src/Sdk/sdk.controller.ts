import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { SdkService } from "./sdk.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CurrentUser } from "src/decorators";
import { Agent } from "http";
import { VerifyDocumentDto } from "./dto/sdk.dto";



@ApiTags('sdk')
@Controller('sdk')
export class SdkController {
    constructor(private readonly sdkService: SdkService) { }

    @Post()
    @ApiOperation({ summary: 'Register a new agent' })
    @ApiResponse({
        status: 201,
        description: 'The agent has been successfully created',
        type: Object,
    })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async verifyDocument(@Body() verifyDocumentDto: VerifyDocumentDto): Promise<boolean> {
        return this.sdkService.verifyAgent(verifyDocumentDto.credDocumentJson!);
    }

}