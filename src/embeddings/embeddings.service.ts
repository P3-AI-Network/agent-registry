// src/embeddings/embeddings.service.ts
import { Injectable } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingsService {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return await this.embeddings.embedQuery(text);
  }

  // Generate embedding from agent data
  async generateAgentEmbedding(agent: {
    name: string;
    description?: string;
    capabilities?: any;
  }): Promise<number[]> {
    const text = this.createSearchableText(agent);
    return await this.generateEmbedding(text);
  }

  private createSearchableText(agent: {
    name: string;
    description?: string;
    capabilities?: any;
  }): string {
    const parts: string[] = [];

    // Name is most important - repeat it with context for emphasis
    parts.push(`Agent Name: ${agent.name}. ${agent.name}.`);

    if (agent.description) {
      parts.push(`Description: ${agent.description}`);
    }

    console.log('Agent capabilities:', agent.capabilities);

    if (agent.capabilities) {
      // Add structured context to capabilities for better semantic understanding
      if (agent.capabilities.ai && agent.capabilities.ai.length > 0) {
        parts.push(
          `AI Capabilities: ${agent.capabilities.ai.join(', ')}. The agent can perform ${agent.capabilities.ai.join(', ')}.`,
        );
      }
      if (
        agent.capabilities.protocols &&
        agent.capabilities.protocols.length > 0
      ) {
        parts.push(
          `Supported Protocols: ${agent.capabilities.protocols.join(', ')}. Compatible with ${agent.capabilities.protocols.join(', ')}.`,
        );
      }
      if (
        agent.capabilities.integration &&
        agent.capabilities.integration.length > 0
      ) {
        parts.push(
          `Integrations: ${agent.capabilities.integration.join(', ')}. Integrates with ${agent.capabilities.integration.join(', ')}.`,
        );
      }
    }

    const searchableText = parts.join('. ');
    console.log('Generated searchable text:', searchableText);
    return searchableText;
  }
}
