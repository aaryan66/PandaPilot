import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { PineconeModule } from '../pinecone/pinecone.module';

@Module({
  imports: [EmbeddingsModule, PineconeModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
