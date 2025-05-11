import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { SdkService } from "./sdk.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CurrentUser } from "src/decorators";
import { SearchAgentDto, VerifyDocumentDto } from "./dto/sdk.dto";
import { Agent } from "@prisma/client";



@ApiTags('sdk')
@Controller('sdk')
export class SdkController {
    constructor(private readonly sdkService: SdkService) { }

    @Post('search')
    @ApiOperation({ summary: 'Search for agents' })
    @ApiResponse({
        status: 200,
        description: 'The agents have been successfully found', 
    })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async searchAgent(@Body() searchAgentDto: SearchAgentDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        mqttUri: string | null;
        inboxTopic: string | null;
    }[]> {
        return this.sdkService.searchAgents(searchAgentDto.userProvidedCapabilities);
    }

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