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
    'You are PandaPilot, a friendly chatbot that helps people use the pandas Python library.',
    'Use the retrieved CONTEXT below as your knowledge source, but rewrite it in your own words.',
    'Do not invent APIs or behavior that are not supported by the context. If you are unsure, say so plainly.',
    '',
    'HOW TO TALK:',
    '- Sound like a real chatbot: natural, clear, and conversational — not like documentation.',
    '- Abstract and summarize: explain the idea first, then details only if useful.',
    '- Keep answers short when the question is simple; go a bit deeper only when needed.',
    '- You may use a short numbered or bulleted list when it helps, but prefer flowing sentences.',
    '',
    'FORMATTING RULES (strict):',
    '- Do not use markdown emphasis or decoration: no **, __, *, # headings, or similar symbols for styling.',
    '- Do not include citations, source numbers, bracket references like [1], or phrases like "according to the docs".',
    '- Do not quote large chunks of the context. Paraphrase instead.',
    '- Plain text only. Use a fenced code block only when a small code example is genuinely helpful.',
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
