import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { MetadataQueryDto } from './dto/metadata-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AgentMetadata } from '@prisma/client';
import { AgentsService } from '../agents/agents.service';
import { CreateMetadataDto } from './dto/create-metadata.dto';
import { UpdateMetadataDto } from './dto/update-metadata.dto';

@ApiTags('metadata')
@Controller('agents/:agentId/metadata')
export class MetadataController {
  constructor(
    private readonly metadataService: MetadataService,
    private readonly agentsService: AgentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add metadata to an agent' })
  @ApiParam({ name: 'agentId', description: 'Agent ID' })
  @ApiResponse({
    status: 201,
    description: 'The metadata has been successfully created',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async createMetadata(
    @Param('agentId') agentId: string,
    @Body() createMetadataDto: CreateMetadataDto,
  ): Promise<AgentMetadata> {
    // Check if agent exists
    const agent = await this.agentsService.findOne(agentId);
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    return this.metadataService.createMetadata(agentId, createMetadataDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all metadata for an agent' })
  @ApiParam({ name: 'agentId', description: 'Agent ID' })
  @ApiResponse({
    status: 200,
    description: 'List of metadata',
    type: [Object],
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getMetadata(
    @Param('agentId') agentId: string,
    @Query() query: MetadataQueryDto,
  ): Promise<AgentMetadata[]> {
    // Check if agent exists
    const agent = await this.agentsService.findOne(agentId);
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    return this.metadataService.findAll(agentId, query);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get specific metadata by key' })
  @ApiParam({ name: 'agentId', description: 'Agent ID' })
  @ApiParam({ name: 'key', description: 'Metadata key' })
  @ApiResponse({
    status: 200,
    description: 'The metadata',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Agent or metadata not found' })
  async getMetadataByKey(
    @Param('agentId') agentId: string,
    @Param('key') key: string,
  ): Promise<AgentMetadata> {
    const metadata = await this.metadataService.findOne(agentId, key);
    if (!metadata) {
      throw new NotFoundException(
        `Metadata with key ${key} not found for agent ${agentId}`,
      );
    }
    return metadata;
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update metadata' })
  @ApiParam({ name: 'agentId', description: 'Agent ID' })
  @ApiParam({ name: 'key', description: 'Metadata key' })
  @ApiResponse({
    status: 200,
    description: 'The metadata has been successfully updated',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Agent or metadata not found' })
  async updateMetadata(
    @Param('agentId') agentId: string,
    @Param('key') key: string,
    @Body() updateMetadataDto: UpdateMetadataDto,
  ): Promise<AgentMetadata> {
    return this.metadataService.updateMetadata(agentId, key, updateMetadataDto);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete metadata' })
  @ApiParam({ name: 'agentId', description: 'Agent ID' })
  @ApiParam({ name: 'key', description: 'Metadata key' })
  @ApiResponse({
    status: 204,
    description: 'The metadata has been successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Agent or metadata not found' })
  async deleteMetadata(
    @Param('agentId') agentId: string,
    @Param('key') key: string,
  ): Promise<void> {
    return this.metadataService.removeMetadata(agentId, key);
  }
}
