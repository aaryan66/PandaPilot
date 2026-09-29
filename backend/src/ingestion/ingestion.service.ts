import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PineconeService } from '../pinecone/pinecone.service';
import { DocumentDto } from './dto/ingest-request.dto';

const CHUNK_SIZE = 800; // characters, kept simple on purpose for a boilerplate
const CHUNK_OVERLAP = 100;

/** Naive fixed-size character chunking with overlap. Swap for a smarter
 * splitter (e.g. by sentence/paragraph) as your project needs grow. */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

@Injectable()
export class IngestionService {
  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly pineconeService: PineconeService,
  ) {}

  async ingest(documents: DocumentDto[]): Promise<{ chunksIndexed: number }> {
    const allChunks: { id: string; text: string; metadata: Record<string, unknown> }[] = [];

    for (const doc of documents) {
      const baseId = doc.id ?? randomUUID();
      const pieces = chunkText(doc.text);
      pieces.forEach((piece, i) => {
        allChunks.push({
          id: `${baseId}-${i}`,
          text: piece,
          metadata: { ...doc.metadata, sourceId: baseId, chunkIndex: i },
        });
      });
    }

    const vectors = await this.embeddingsService.embedBatch(
      allChunks.map((chunk) => chunk.text),
    );

    await this.pineconeService.upsert(
      allChunks.map((chunk, i) => ({
        id: chunk.id,
        vector: vectors[i],
        text: chunk.text,
        metadata: chunk.metadata,
      })),
    );

    return { chunksIndexed: allChunks.length };
  }
}
