import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMessageRequestDto {
  @ApiProperty({ example: 'conversation-123' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ example: 'Hello from API' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { source: 'web', importance: 'normal' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
