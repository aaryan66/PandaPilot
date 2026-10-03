import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PineconeService } from '../pinecone/pinecone.service';
import { DocumentDto } from './dto/ingest-request.dto';
import { IngestRstRequestDto } from './dto/ingest-rst-request.dto';
import { IngestRstResponseDto } from './dto/ingest-rst-response.dto';

const CHUNK_SIZE = 800; // characters, kept simple on purpose for a boilerplate
const CHUNK_OVERLAP = 100;
/** Pinecone upserts are safer in batches; keep memory bounded for large .rst docs. */
const UPSERT_BATCH_SIZE = 100;
const DEFAULT_RST_DIRECTORY = '../pandas_docs';

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

/** Light cleanup so embeddings see prose more than Sphinx markup. */
function normalizeRst(text: string): string {
  return text
    .replace(/\{\{\s*header\s*\}\}/g, '')
    .replace(/^\.\.\s+_[^\n]+:\s*$/gm, '')
    .replace(/^\.\.\s+[^\n]*$/gm, '')
    .replace(/:[a-zA-Z]+:`([^`]+)`/g, '$1')
    .replace(/``([^`]+)``/g, '$1')
    .replace(/`([^`]+)`_/g, '$1')
    .replace(/^[*=\-^~]{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

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

    const upsertPayload = allChunks.map((chunk, i) => ({
      id: chunk.id,
      vector: vectors[i],
      text: chunk.text,
      metadata: chunk.metadata,
    }));

    for (let i = 0; i < upsertPayload.length; i += UPSERT_BATCH_SIZE) {
      await this.pineconeService.upsert(
        upsertPayload.slice(i, i + UPSERT_BATCH_SIZE),
      );
    }

    return { chunksIndexed: allChunks.length };
  }

  async ingestRst(options: IngestRstRequestDto = {}): Promise<IngestRstResponseDto> {
    const directory = await this.resolveRstDirectory(options.directory);
    const filenames = await this.listRstFiles(directory, options.files);

    let chunksIndexed = 0;
    const processed: string[] = [];

    for (const filename of filenames) {
      const filePath = path.join(directory, filename);
      const raw = await fs.readFile(filePath, 'utf8');
      const text = normalizeRst(raw);

      if (!text) {
        this.logger.warn(`Skipping empty .rst after cleanup: ${filename}`);
        continue;
      }

      const title = filename.replace(/\.rst$/i, '');
      const result = await this.ingest([
        {
          id: `rst-${title}`,
          text,
          metadata: {
            title,
            filename,
            source: 'pandas_docs',
            format: 'rst',
          },
        },
      ]);

      chunksIndexed += result.chunksIndexed;
      processed.push(filename);
      this.logger.log(
        `Ingested ${filename} (${result.chunksIndexed} chunks)`,
      );
    }

    if (processed.length === 0) {
      throw new BadRequestException('No non-empty .rst files were ingested');
    }

    return {
      filesProcessed: processed.length,
      files: processed,
      chunksIndexed,
    };
  }

  private async resolveRstDirectory(directory?: string): Promise<string> {
    const resolved = path.resolve(
      process.cwd(),
      directory?.trim() || DEFAULT_RST_DIRECTORY,
    );

    let stats;
    try {
      stats = await fs.stat(resolved);
    } catch {
      throw new NotFoundException(
        `RST directory not found: ${resolved}. Pass "directory" or place files under pandas_docs.`,
      );
    }

    if (!stats.isDirectory()) {
      throw new BadRequestException(`Path is not a directory: ${resolved}`);
    }

    return resolved;
  }

  private async listRstFiles(
    directory: string,
    requested?: string[],
  ): Promise<string[]> {
    if (requested?.length) {
      const missing: string[] = [];
      for (const name of requested) {
        try {
          const stats = await fs.stat(path.join(directory, name));
          if (!stats.isFile()) missing.push(name);
        } catch {
          missing.push(name);
        }
      }
      if (missing.length) {
        throw new NotFoundException(
          `Missing .rst file(s) in ${directory}: ${missing.join(', ')}`,
        );
      }
      return [...requested].sort();
    }

    const entries = await fs.readdir(directory);
    const rstFiles = entries
      .filter((name) => name.toLowerCase().endsWith('.rst'))
      .sort();

    if (rstFiles.length === 0) {
      throw new NotFoundException(`No .rst files found in ${directory}`);
    }

    return rstFiles;
  }
}
