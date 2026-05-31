import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMessageUseCase } from '../../application/use-cases/create-message.use-case';
import { CreateMessageRequestDto } from '../dto/create-message.request.dto';

@ApiTags('messages')
@Controller('api/messages')
export class MessagesController {
  constructor(private readonly createMessageUseCase: CreateMessageUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createMessage(@Body() request: CreateMessageRequestDto) {
    return this.createMessageUseCase.execute({
      conversationId: request.conversationId,
      content: request.content,
      senderId: request.senderId,
      metadata: request.metadata,
    });
  }
}
