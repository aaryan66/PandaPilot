import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { PineconeModule } from '../pinecone/pinecone.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [EmbeddingsModule, PineconeModule, LlmModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
