import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai/index.mjs';
import { RetrievedChunk } from '../pinecone/pinecone.service';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Builds the system prompt that grounds the model in retrieved context.
 * This is the "additional prompting" layer — edit freely per project:
 * add tone/persona instructions, refusal rules, output format, etc.
 */
function buildSystemPrompt(context: RetrievedChunk[]): string {
  const contextBlock = context.length
    ? context
        .map((chunk, i) => `[${i + 1}] ${chunk.text}`)
        .join('\n\n')
    : 'No relevant context was found in the knowledge base.';

  return [
    'You are a helpful assistant that answers questions using the provided context.',
    'Rules:',
    '- Only use the CONTEXT below to answer. If the answer is not in the context, say you don\'t know.',
    '- Be concise and direct.',
    '- When you use a fact from the context, cite it inline like [1], [2], matching the numbered sources.',
    '',
    'CONTEXT:',
    contextBlock,
  ].join('\n');
}

@Injectable()
export class LlmService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('llm.apiKey'),
      baseURL: this.configService.get<string>('llm.baseUrl'),
    });
    this.model = this.configService.get<string>('llm.model')!;
  }

  async generateAnswer(
    question: string,
    context: RetrievedChunk[],
    history: ChatTurn[] = [],
  ): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: buildSystemPrompt(context) },
        ...history,
        { role: 'user', content: question },
      ],
    });

    return completion.choices[0]?.message?.content ?? '';
  }
}
