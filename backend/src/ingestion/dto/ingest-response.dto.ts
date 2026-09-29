import { ApiProperty } from '@nestjs/swagger';

export class IngestResponseDto {
  @ApiProperty({
    example: 3,
    description: 'Number of chunks embedded and upserted into Pinecone',
  })
  chunksIndexed: number;
}
