import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';

export interface RetrievedChunk {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
}

export interface UpsertChunk {
  id: string;
  vector: number[];
  text: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PineconeService {
  private readonly client: Pinecone;
  private readonly indexName: string;
  private readonly namespace: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Pinecone({
      apiKey: this.configService.get<string>('pinecone.apiKey')!,
    });
    this.indexName = this.configService.get<string>('pinecone.index')!;
    this.namespace = this.configService.get<string>('pinecone.namespace')!;
  }

  private get index() {
    return this.client.index(this.indexName).namespace(this.namespace);
  }

  async upsert(chunks: UpsertChunk[]): Promise<void> {
    await this.index.upsert(
      chunks.map((chunk) => ({
        id: chunk.id,
        values: chunk.vector,
        metadata: { text: chunk.text, ...chunk.metadata },
      })),
    );
  }

  async query(vector: number[], topK: number): Promise<RetrievedChunk[]> {
    const result = await this.index.query({
      vector,
      topK,
      includeMetadata: true,
    });

    return (result.matches ?? []).map((match) => {
      const metadata = (match.metadata ?? {}) as Record<string, unknown>;
      const { text, ...rest } = metadata;
      return {
        id: match.id,
        score: match.score ?? 0,
        text: typeof text === 'string' ? text : '',
        metadata: rest,
      };
    });
  }

  async deleteAll(): Promise<void> {
    await this.index.deleteAll();
  }
}
