import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMessageRequestDto {
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  senderId!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
