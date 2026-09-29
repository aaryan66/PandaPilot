import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class DocumentDto {
  @ApiProperty({
    required: false,
    example: 'doc-1',
    description: 'Stable id for the source document; chunks are stored as "<id>-<chunkIndex>"',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    example: 'NestJS is a progressive Node.js framework for building efficient, scalable server-side applications.',
  })
  @IsString()
  @MaxLength(20000)
  text: string;

  @ApiProperty({
    required: false,
    example: { title: 'Intro' },
    description: 'Arbitrary metadata stored alongside each chunk and returned with matches at query time',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class IngestRequestDto {
  @ApiProperty({ type: [DocumentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents: DocumentDto[];
}
