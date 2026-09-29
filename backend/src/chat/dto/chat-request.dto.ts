import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ChatHistoryTurnDto {
  @ApiProperty({ enum: ['user', 'assistant'], example: 'user' })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ example: 'hi' })
  @IsString()
  @MaxLength(4000)
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ example: 'What is NestJS?' })
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiProperty({
    type: [ChatHistoryTurnDto],
    required: false,
    example: [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello! how can I help?' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryTurnDto)
  history: ChatHistoryTurnDto[] = [];
}
