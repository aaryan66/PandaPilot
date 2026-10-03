import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { IngestRequestDto } from './dto/ingest-request.dto';
import { IngestResponseDto } from './dto/ingest-response.dto';
import { IngestRstRequestDto } from './dto/ingest-rst-request.dto';
import { IngestRstResponseDto } from './dto/ingest-rst-response.dto';

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

  @ApiOperation({
    summary:
      'Read local .rst documentation files, chunk/embed them, and upsert into Pinecone',
    description:
      'Defaults to the repo\'s pandas_docs folder (../pandas_docs from the backend). Pass "files" to ingest a subset.',
  })
  @ApiOkResponse({ type: IngestRstResponseDto })
  @Post('rst')
  async ingestRst(
    @Body() body: IngestRstRequestDto = {},
  ): Promise<IngestRstResponseDto> {
    return this.ingestionService.ingestRst(body);
  }
}
