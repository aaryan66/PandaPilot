import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PineconeService, RetrievedChunk } from '../pinecone/pinecone.service';
import { LlmService, ChatTurn } from '../llm/llm.service';

export interface ChatResult {
  answer: string;
  sources: RetrievedChunk[];
}

@Injectable()
export class ChatService {
  private readonly topK: number;

  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly pineconeService: PineconeService,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
  ) {
    this.topK = this.configService.get<number>('retrieval.topK')!;
  }

  async ask(message: string, history: ChatTurn[]): Promise<ChatResult> {
    const queryVector = await this.embeddingsService.embed(message);
    const sources = await this.pineconeService.query(queryVector, this.topK);
    const answer = await this.llmService.generateAnswer(
      message,
      sources,
      history,
    );

    return { answer, sources };
  }
}
