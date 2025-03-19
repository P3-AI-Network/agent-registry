import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Agent, Prisma } from '@prisma/client';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentQueryDto } from './dto/agent-query.dto';
import { ethers } from 'ethers';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new agent in the registry
   */
  async createAgent(createAgentDto: CreateAgentDto): Promise<Agent> {
    const signersAddress = ethers.verifyMessage(
      createAgentDto.message,
      createAgentDto.signature,
    );

    const user = await this.prisma.user.findFirst({
      where: {
        walletAddress: {
          equals: signersAddress,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.agent.create({
      data: {
        did: createAgentDto.did,
        name: createAgentDto.name,
        description: createAgentDto.description,
        capabilities: createAgentDto.capabilities,
        status: createAgentDto.status,
        ownerId: user.id,
      },
    });
  }

  /**
   * Find all agents with pagination and filters
   */
  async findAll(query: AgentQueryDto): Promise<{
    data: Agent[];
    count: number;
    total: number;
  }> {
    const { name, status, capabilities, did, limit = 10, offset = 0 } = query;

    // Build where conditions
    const where: Prisma.AgentWhereInput = {};

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (status) {
      where.status = status;
    }

    if (did) {
      where.did = did;
    }

    if (capabilities && capabilities.length > 0) {
      // We need to check if the agent's capabilities JSON contains any of the requested capabilities
      // This uses PostgreSQL's JSON operators
      where.capabilities = {
        path: capabilities.map((cap) => `$..${cap}`),
        not: {},
      };
    }

    // Execute the query with pagination
    const [data, total] = await Promise.all([
      this.prisma.agent.findMany({
        // where: {
        //   capabilities: {
        //     path: capabilities?.map((cap) => `$..${cap}`),
        //   },
        // },
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      data,
      count: data.length,
      total,
    };
  }

  /**
   * Find one agent by ID
   */
  async findOne(id: string): Promise<Agent | null> {
    return this.prisma.agent.findUnique({
      where: { id },
    });
  }

  /**
   * Find one agent by DID
   */
  async findByDid(did: string): Promise<Agent | null> {
    return this.prisma.agent.findUnique({
      where: { did },
    });
  }

  /**
   * Update an agent's information
   */
  async updateAgent(
    id: string,
    updateAgentDto: UpdateAgentDto,
  ): Promise<Agent> {
    try {
      return await this.prisma.agent.update({
        where: { id },
        data: updateAgentDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Agent with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  /**
   * Remove an agent from the registry
   */
  async removeAgent(id: string): Promise<void> {
    try {
      await this.prisma.agent.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Agent with ID ${id} not found`);
        }
      }
      throw error;
    }
  }
}
