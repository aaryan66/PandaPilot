import { ApiProperty } from '@nestjs/swagger';

export class ChatSourceDto {
  @ApiProperty({ example: 'doc-1-0' })
  id: string;

  @ApiProperty({ example: 0.83, description: 'Cosine similarity score from Pinecone' })
  score: number;

  @ApiProperty({
    example: 'NestJS is a progressive Node.js framework for building efficient server-side applications.',
  })
  text: string;

  @ApiProperty({
    example: { sourceId: 'doc-1', chunkIndex: 0, title: 'Intro' },
    description: 'Any extra metadata stored alongside the chunk at ingestion time',
  })
  metadata: Record<string, unknown>;
}

export class ChatResponseDto {
  @ApiProperty({
    example: 'NestJS is a progressive Node.js framework for building efficient, scalable server-side applications [1].',
  })
  answer: string;

  @ApiProperty({ type: [ChatSourceDto] })
  sources: ChatSourceDto[];
}
