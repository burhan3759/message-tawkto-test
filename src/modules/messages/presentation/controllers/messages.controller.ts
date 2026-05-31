import { Body, Controller, Post } from '@nestjs/common';
import { CreateMessageUseCase } from '../../application/use-cases/create-message.use-case';
import { CreateMessageRequestDto } from '../dto/create-message.request.dto';

@Controller('api/messages')
export class MessagesController {
  constructor(private readonly createMessageUseCase: CreateMessageUseCase) {}

  @Post()
  async createMessage(@Body() request: CreateMessageRequestDto) {
    return this.createMessageUseCase.execute({
      conversationId: request.conversationId,
      content: request.content,
      senderId: request.senderId,
      metadata: request.metadata,
    });
  }
}
