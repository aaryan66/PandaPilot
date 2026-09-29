import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { IngestRequestDto } from './dto/ingest-request.dto';
import { IngestResponseDto } from './dto/ingest-response.dto';

@ApiTags('ingest')
@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @ApiOperation({
    summary: 'Chunk, embed, and upsert documents into the Pinecone index',
  })
  @ApiOkResponse({ type: IngestResponseDto })
  @Post()
  async ingest(@Body() body: IngestRequestDto): Promise<IngestResponseDto> {
    return this.ingestionService.ingest(body.documents);
  }
}
