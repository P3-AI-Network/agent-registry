import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Agent, Prisma } from '@prisma/client';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentQueryDto } from './dto/agent-query.dto';
import { createIdentity, generateSeed, seedToBase64 } from 'src/identity-wallet';
import { ConfigService } from '@nestjs/config';
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

export const AgentProfileSchema = z.object({
  agentName: z.string(),
  description: z.string(),
  capabilities: z.object({
    ai: z.array(z.string()),
    protocols: z.array(z.string()),
    integration: z.array(z.string()),
  })
});
export type AgentProfile = z.infer<typeof AgentProfileSchema>;



export async function analyzeWorkflow(workflowJson: any): Promise<AgentProfile> {

  const parser = StructuredOutputParser.fromZodSchema(AgentProfileSchema);
  const formatInstructions = parser.getFormatInstructions();

  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.2,
  }).withStructuredOutput(AgentProfileSchema);

  const prompt = `
    You are an AI system that analyzes n8n workflow JSON and generates an agent profile.

    Follow the required JSON structure exactly.

    Workflow JSON:
    ${JSON.stringify(workflowJson, null, 2)}

    Your tasks:
    1. agentName → Use workflow.name
    2. description → Summarize what the workflow does based on its nodes & connections (4–6 lines max).
    3. capabilities → Infer capabilities:
      - ai: NLP, agent-search, translation, classification, LLM features
      - protocols: HTTP, triggers, REST, custom protocols
      - integration: APIs, services, custom nodes

    You MUST follow this strict JSON format:

    ${formatInstructions}
  `;
  const result = await model.invoke(prompt);

  return {
    agentName: result.agentName,
    description: result.description,
    capabilities: result.capabilities
  };
}



@Injectable()
export class AgentsService {
  constructor(private prismaService: PrismaService, private configService: ConfigService) { }


  async getCredentials(agentDIDIdentifier: string) {

    const username = this.configService.get('ISSUER_USERNAME');
    const password = this.configService.get('ISSUER_PASSWORD');
    const issuerUrl = this.configService.get('ISSUER_NODE_URL');

    const tokenBase64 = btoa(`${username}:${password}`);


    const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');
    const resp = await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/connections?query=${agentDIDIdentifier}&page=1&max_results=1&credentials=true`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${tokenBase64}`,
        'Content-Type': 'application/json',
      }
    });

    if (resp.status !== 200) {
      throw new InternalServerErrorException("Issuer node Error")
    }

    const data = await resp.json();

    return data.items[0].credentials
  }


  async createConnection(userDIDIdentifier: string, userDID: string) {

    const username = this.configService.get('ISSUER_USERNAME');
    const password = this.configService.get('ISSUER_PASSWORD');
    const issuerUrl = this.configService.get('ISSUER_NODE_URL');
    const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');

    const tokenBase64 = btoa(`${username}:${password}`);

    await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/connections`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${tokenBase64}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "userDID": userDIDIdentifier,
        "userDoc": JSON.parse(userDID),
        "issuerDoc": JSON.parse(userDID)
      }),
    });

  }

  async getConnection(userDIDIdentifier: string) {

    const username = this.configService.get('ISSUER_USERNAME');
    const password = this.configService.get('ISSUER_PASSWORD');
    const issuerUrl = this.configService.get('ISSUER_NODE_URL');

    const tokenBase64 = btoa(`${username}:${password}`);


    const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');
    const resp = await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/connections?query=${userDIDIdentifier}&page=1&max_results=1`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${tokenBase64}`,
        'Content-Type': 'application/json',
      }
    });

    if (resp.status !== 200) {
      throw new InternalServerErrorException("Issuer node Error")
    }

    const data = await resp.json();

    return data.items[0].id
  }


  async issueCredential(agentDIDIdentifier: string) {

    const username = this.configService.get('ISSUER_USERNAME');
    const password = this.configService.get('ISSUER_PASSWORD');
    const issuerUrl = this.configService.get('ISSUER_NODE_URL');
    const userIdentitySchemaUrl = this.configService.get('USER_IDENTITY_SCHEMA_URL');
    const tokenBase64 = btoa(`${username}:${password}`);

    const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

    const bodyData = {
      credentialSchema: userIdentitySchemaUrl,
      credentialSubject: {
        id: agentDIDIdentifier,
        owner: agentDIDIdentifier
      },
      expiration: oneYearFromNow,
      proofs: ["Iden3SparseMerkleTreeProof", "BJJSignature2021"],
      refreshService: null,
      type: "Identity"
    };

    const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');

    const resp = await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/credentials`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${tokenBase64}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData)
    });

    const data = await resp.json()
    console.log(data)
    console.log(resp.status)
    if (resp.status !== 201) {
      throw new InternalServerErrorException("Issuer node Error")
    }

  }

  /**
   * Create a new agent in the registry
   */
  async createAgent(userId: string, createAgentDto: CreateAgentDto, id: string | undefined = undefined): Promise<Agent> {

    let agentId = id ? id : "";

    try {

      let newSeed = generateSeed();
      let newIdentity = await createIdentity(newSeed);

      // Start Prisma transaction
      let agent = await this.prismaService.$transaction(async (tx) => {
        const agent = await this.prismaService.agent.create({
          data: {
            id,
            didIdentifier: newIdentity.identifier,
            did: newIdentity.did,
            seed: seedToBase64(newSeed),
            name: createAgentDto.name,
            description: createAgentDto.description,
            capabilities: createAgentDto.capabilities,
            status: createAgentDto.status,
            ownerId: userId,
          },
        });

        agentId = agent.id
        await this.createConnection(agent.didIdentifier, agent.did);
        const connectionId = await this.getConnection(agent.didIdentifier);

        await tx.agent.update({
          where: { didIdentifier: newIdentity.identifier },
          data: { connectionString: connectionId }
        });

        return agent;
      });

      await this.issueCredential(agent.didIdentifier);

      return agent;

    } catch (err) {
      // Rollback: If any external call fails, delete the user to maintain atomicity
      console.log("id", agentId)
      await this.prismaService.agent.delete({
        where: { id: agentId }
      });
      throw new BadRequestException("Failed to create Agent identity: " + err.message);
    }

  }

  /**
   * Create a new N8N agent in the registry
   */
  async createN8NAgent(userId: string, createN8NAgentJson: any): Promise<Agent> {

    try {

      // Check if workflow already agent already created
      const existingAgent = await this.prismaService.agent.findFirst({
        where: {
          id: createN8NAgentJson.id
        }
      });

      if (existingAgent) {
        return existingAgent;
      }

      const analyzedProfile = await analyzeWorkflow(createN8NAgentJson);

      const createAgentDto: CreateAgentDto = {
        name: analyzedProfile.agentName,
        description: analyzedProfile.description,
        capabilities: analyzedProfile.capabilities,
        status: "ACTIVE"
      };

      const agent = await this.createAgent(userId, createAgentDto, createN8NAgentJson.id);
      return agent;

    } catch (error) {
      throw new BadRequestException("Failed to analyze N8N workflow: " + error.message);
    }

  }

  /**
   * Fetch all agents created by the User
   */
  async getMyAgetns(userId: string): Promise<Agent[]> {

    return await this.prismaService.agent.findMany({
      where: {
        ownerId: userId
      }
    })

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
      this.prismaService.agent.findMany({
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
      this.prismaService.agent.count({ where }),
    ]);

    return {
      data,
      count: data.length,
      total,
    };
  }

  async findOne(id: string, userId: number = -1): Promise<{ agent: any, credentials: any } | null> {

    const isAgentOwner = await this.prismaService.agent.count({
      where: {
        id,
        ownerId: userId.toString()
      }
    }) > 0;

    const agent = await this.prismaService.agent.findUnique({
      where: { id },
      select: {
        id: true,
        didIdentifier: true,
        did: true,
        name: true,
        description: true,
        capabilities: true,
        connectionString: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        mqttUri: true,
        inboxTopic: true,
        seed: isAgentOwner,
        owner: {
          select: {
            walletAddress: true
          }
        }
      }
    });

    if (!agent) {
      return null
    }

    const credentials = await this.getCredentials(agent?.didIdentifier!);

    return {
      agent,
      credentials
    }
  }

  /**
   * Find one agent by DID
   */
  async findByDid(did: string): Promise<Agent | null> {
    return this.prismaService.agent.findUnique({
      where: { did },
    });
  }

  /**
   * Update an agent's information
   */
  async updateAgent(
    id: string,
    updateAgentDto: UpdateAgentDto,
    userId: string
  ): Promise<Agent> {
    try {
      return await this.prismaService.agent.update({
        where: {
          id,
          ownerId: userId
        },
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
  async removeAgent(id: string, userId: string): Promise<void> {
    try {
      await this.prismaService.agent.delete({
        where: {
          id,
          ownerId: userId
        },
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


  async updateMqtt(seed: string, mqttUri: string): Promise<void> {
    try {
      const agent = await this.prismaService.agent.findFirst({
        where: {
          seed
        }
      });

      if (!agent) {
        throw new UnauthorizedException(`Forbidden`);
      }

      await this.prismaService.agent.update({
        where: {
          id: agent.id
        },
        data: {
          mqttUri: mqttUri
        }
      });

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new InternalServerErrorException(`Update Failed`);
        }
      }
      throw error;
    }
  }


  async updateN8NWebhookUrl(userId: string, n8nHttpWebhookUrl: string, agentId: string): Promise<void> {
    try {
      const agent = await this.prismaService.agent.findFirst({
        where: {
          ownerId: userId,
          id: agentId
        }
      });

      if (!agent) {
        throw new UnauthorizedException(`Forbidden`);
      }

      await this.prismaService.agent.update({
        where: {
          id: agent.id
        },
        data: {
          n8nHttpWebhookUrl: n8nHttpWebhookUrl
        }
      });

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new InternalServerErrorException(`Update Failed`);
        }
      }
      throw error;
    }

  }
}
