import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class IngestRstRequestDto {
  @ApiProperty({
    required: false,
    example: '../pandas_docs',
    description:
      'Directory containing .rst files, relative to the backend working directory. Defaults to ../pandas_docs (the repo\'s pandas_docs folder).',
  })
  @IsOptional()
  @IsString()
  directory?: string;

  @ApiProperty({
    required: false,
    example: ['groupby.rst', 'merging.rst'],
    description:
      'Optional subset of filenames to ingest. Only .rst names are allowed. When omitted, every .rst file in the directory is ingested.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @Matches(/^[A-Za-z0-9._-]+\.rst$/, {
    each: true,
    message: 'each file must be a plain .rst filename (no path separators)',
  })
  files?: string[];
}
