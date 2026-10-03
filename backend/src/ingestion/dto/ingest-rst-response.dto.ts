import { ApiProperty } from '@nestjs/swagger';

export class IngestRstResponseDto {
  @ApiProperty({
    example: 12,
    description: 'Number of .rst files successfully read and ingested',
  })
  filesProcessed: number;

  @ApiProperty({
    example: ['groupby.rst', 'merging.rst'],
    description: 'Filenames that were ingested',
  })
  files: string[];

  @ApiProperty({
    example: 84,
    description: 'Total number of chunks embedded and upserted into Pinecone',
  })
  chunksIndexed: number;
}
