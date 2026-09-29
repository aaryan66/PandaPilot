import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Local, in-process embedding model via @xenova/transformers (ONNX runtime).
 *
 * Why a local model instead of an embeddings API:
 * - Zero per-call cost and no extra API key to manage.
 * - The quantized MiniLM model (~25MB) is light enough to load and run
 *   within Render's free tier (512MB RAM), unlike larger transformer models.
 * - Output is 384-dimensional — make sure your Pinecone index is created
 *   with dimension 384 and metric "cosine" to match.
 *
 * The `@xenova/transformers` package is loaded dynamically because it ships
 * as an ES module; requiring it at the top of a CommonJS file would break.
 */
@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private extractor: any;
  private modelName: string;
  private loadingPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.modelName = this.configService.get<string>('embedding.model')!;
  }

  async onModuleInit() {
    // Warm the model up at startup so the first real request isn't slow.
    // On Render's free tier the instance also sleeps after inactivity, so
    // the very first request after a cold start will still take a few
    // seconds regardless — this just avoids paying that cost twice.
    this.loadModel().catch((err) =>
      this.logger.error('Failed to preload embedding model', err),
    );
  }

  private async loadModel(): Promise<void> {
    if (this.extractor) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers');
      // Keep everything in-process; don't try to use local model files by default.
      env.allowLocalModels = false;
      // Default cache dir is inside node_modules, which isn't writable when
      // running as a non-root user (e.g. in the Docker image) — point it at
      // a top-level directory instead so the downloaded model can be cached.
      env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR ?? './.cache';
      this.logger.log(`Loading embedding model: ${this.modelName}`);
      this.extractor = await pipeline('feature-extraction', this.modelName, {
        quantized: true,
      });
      this.logger.log('Embedding model ready');
    })();

    return this.loadingPromise;
  }

  /** Embed a single piece of text into a normalized vector. */
  async embed(text: string): Promise<number[]> {
    const [vector] = await this.embedBatch([text]);
    return vector;
  }

  /** Embed multiple texts. Runs sequentially to keep memory usage predictable. */
  async embedBatch(texts: string[]): Promise<number[][]> {
    await this.loadModel();

    const vectors: number[][] = [];
    for (const text of texts) {
      const output = await this.extractor(text, {
        pooling: 'mean',
        normalize: true,
      });
      vectors.push(Array.from(output.data as Float32Array));
    }
    return vectors;
  }
}
