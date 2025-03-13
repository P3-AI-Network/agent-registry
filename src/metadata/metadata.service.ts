import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentMetadata, Prisma } from '@prisma/client';
import { MetadataQueryDto } from './dto/metadata-query.dto';
import { CreateMetadataDto } from './dto/create-metadata.dto';
import { UpdateMetadataDto } from './dto/update-metadata.dto';

@Injectable()
export class MetadataService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new metadata entry for an agent
   */
  async createMetadata(
    agentId: string,
    createMetadataDto: CreateMetadataDto,
  ): Promise<AgentMetadata> {
    try {
      return await this.prisma.agentMetadata.create({
        data: {
          agentId,
          ...createMetadataDto,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Unique constraint failed - metadata with this key already exists
        throw new Error(
          `Metadata with key ${createMetadataDto.key} already exists for this agent`,
        );
      }
      throw error;
    }
  }

  /**
   * Find all metadata entries for an agent
   */
  async findAll(
    agentId: string,
    query: MetadataQueryDto,
  ): Promise<AgentMetadata[]> {
    const { visibility } = query;

    const where: Prisma.AgentMetadataWhereInput = { agentId };

    if (visibility) {
      where.visibility = visibility;
    }

    return this.prisma.agentMetadata.findMany({
      where,
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Find a specific metadata entry by key
   */
  async findOne(agentId: string, key: string): Promise<AgentMetadata | null> {
    return this.prisma.agentMetadata.findFirst({
      where: {
        agentId,
        key,
      },
    });
  }

  /**
   * Update a metadata entry
   */
  async updateMetadata(
    agentId: string,
    key: string,
    updateMetadataDto: UpdateMetadataDto,
  ): Promise<AgentMetadata> {
    try {
      const metadata = await this.findOne(agentId, key);
      if (!metadata) {
        throw new NotFoundException(
          `Metadata with key ${key} not found for agent ${agentId}`,
        );
      }

      return await this.prisma.agentMetadata.update({
        where: { id: metadata.id },
        data: updateMetadataDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Metadata with key ${key} not found for agent ${agentId}`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Remove a metadata entry
   */
  async removeMetadata(agentId: string, key: string): Promise<void> {
    try {
      const metadata = await this.findOne(agentId, key);
      if (!metadata) {
        throw new NotFoundException(
          `Metadata with key ${key} not found for agent ${agentId}`,
        );
      }

      await this.prisma.agentMetadata.delete({
        where: { id: metadata.id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Metadata with key ${key} not found for agent ${agentId}`,
          );
        }
      }
      throw error;
    }
  }
}
