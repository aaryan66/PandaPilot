import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({
    summary: 'Ask a question — retrieves context from Pinecone and generates a grounded answer',
  })
  @ApiOkResponse({ type: ChatResponseDto })
  @Post()
  async chat(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
    const { answer, sources } = await this.chatService.ask(
      body.message,
      body.history,
    );

    return {
      answer,
      sources: sources.map((source) => ({
        id: source.id,
        score: source.score,
        text: source.text,
        metadata: source.metadata,
      })),
    };
  }
}
