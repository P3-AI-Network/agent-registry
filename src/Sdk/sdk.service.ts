import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Agent, AgentStatus } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

/**
 * Interface for search result objects
 */
interface AgentSearchResult {
  id: string;
  name: string;
  description: string | null;
  mqttUri: string | null;
  inboxTopic: string | null;
  matchScore: number; // Similarity percentage (0.0 to 1.0)
  didIdentifier: string;
}

@Injectable()
export class SdkService {
  constructor(private configService: ConfigService, private prismaService: PrismaService) { }

  async verifyAgent(credDocument: string) {

    const username = this.configService.get('ISSUER_USERNAME');
    const password = this.configService.get('ISSUER_PASSWORD');
    const issuerUrl = this.configService.get('ISSUER_NODE_URL');
    const issuerDIDIdentifier = this.configService.get('ISSUER_DID_IDENTIFIER');

    const tokenBase64 = btoa(`${username}:${password}`);

    const credJson = JSON.parse(credDocument);
    const userDid = credJson.vc.credentialSubject.id;


    const resp = await fetch(`${issuerUrl}/v2/identities/${issuerDIDIdentifier}/credentials?page=1&credentialSubject=${userDid}&max_results=2`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${tokenBase64}`,
        'Content-Type': 'application/json',
      }
    });

    if (resp.status !== 200) {
      throw new InternalServerErrorException("Issuer node Error")
    }

    const jsn: any = await resp.json();
    const data: object[] = jsn.items;

    if (data.length === 0) {
      return false;
    }

    const found = data.find(item => JSON.stringify(item) === JSON.stringify(credJson))

    if (!found) {
      return false;
    }

    return true;
  }

  /**
     * Search for agents based on capabilities with text similarity matching
     * Returns only results with at least 60% similarity
     */
  async searchAgents(userProvidedCapabilities: string[]): Promise<AgentSearchResult[]> {
    // If no capabilities provided, return all active agents
    if (!userProvidedCapabilities || userProvidedCapabilities.length === 0) {
      const agents = await this.prismaService.agent.findMany({
        where: { status: AgentStatus.ACTIVE },
        select: {
          id: true,
          name: true,
          description: true,
          mqttUri: true,
          inboxTopic: true,
          didIdentifier: true
        }
      });

      return agents.map(agent => ({
        ...agent,
        matchScore: 1.0 // Full match score when no criteria
      }));
    }

    // Convert all search terms to lowercase for case-insensitive matching
    const normalizedCapabilities = userProvidedCapabilities.map(cap => cap.toLowerCase());

    // Get all agents with their capabilities
    const allAgents = await this.prismaService.agent.findMany({
      where: { status: AgentStatus.ACTIVE },
      select: {
        id: true,
        name: true,
        description: true,
        mqttUri: true,
        inboxTopic: true,
        capabilities: true,
        didIdentifier: true
      }
    });

    const similarityThreshold = 0.6; // 60% similarity threshold
    const results: AgentSearchResult[] = [];

    // Process each agent to find matching capabilities
    for (const agent of allAgents) {
      // Extract capabilities from the agent
      const capabilities = agent.capabilities as any || {};

      // Get all capability arrays and convert them to lowercase strings
      const aiCapabilities = this.normalizeCapabilityArray(capabilities.ai);
      const protocolCapabilities = this.normalizeCapabilityArray(capabilities.protocols);
      const integrationCapabilities = this.normalizeCapabilityArray(capabilities.integration);

      // Combine all capabilities for this agent
      const allAgentCapabilities = [
        ...aiCapabilities,
        ...protocolCapabilities,
        ...integrationCapabilities
      ];

      // Find the best match score for any user-provided capability
      let bestMatchScore = 0;

      for (const userCap of normalizedCapabilities) {
        for (const agentCap of allAgentCapabilities) {
          const similarity = this.calculateStringSimilarity(userCap, agentCap);
          bestMatchScore = Math.max(bestMatchScore, similarity);

          // Optional early exit if perfect match found
          if (bestMatchScore >= 0.99) break;
        }

        // Optional early exit if perfect match found
        if (bestMatchScore >= 0.99) break;
      }

      // Only include results above the similarity threshold
      if (bestMatchScore >= similarityThreshold) {
        results.push({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          mqttUri: agent.mqttUri,
          inboxTopic: agent.inboxTopic,
          matchScore: bestMatchScore,
          didIdentifier: agent.didIdentifier
        });
      }
    }

    // Sort by match score (highest first)
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Helper to normalize capability array to lowercase strings
   */
  private normalizeCapabilityArray(capabilities: any[]): string[] {
    if (!Array.isArray(capabilities)) return [];

    return capabilities.map(capability =>
      typeof capability === 'string'
        ? capability.toLowerCase().trim()
        : String(capability).toLowerCase().trim()
    );
  }

  /**
   * Calculate string similarity between two strings
   * Returns a score between 0.0 (no similarity) and 1.0 (identical)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Handle exact matches
    if (str1 === str2) return 1.0;

    // Handle case where one string contains the other
    if (str1.includes(str2)) {
      return str2.length / str1.length;
    }
    if (str2.includes(str1)) {
      return str1.length / str2.length;
    }

    // For more complex cases, use Levenshtein distance
    const longerStr = str1.length > str2.length ? str1 : str2;
    const shorterStr = str1.length > str2.length ? str2 : str1;

    // Early exit if strings are too different in length
    if (shorterStr.length === 0) return 0.0;
    if (longerStr.length === 0) return 0.0;

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2);

    // Convert to similarity score (0 to 1)
    return 1 - distance / Math.max(str1.length, str2.length);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return track[str2.length][str1.length];
  }
}