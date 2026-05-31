import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateMessageCommand } from '../dto/create-message.command';
import { Message } from '../../domain/entities/message.entity';
import {
  MESSAGE_REPOSITORY,
  MessageRepository,
} from '../../domain/repositories/message.repository';

@Injectable()
export class CreateMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(command: CreateMessageCommand): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      conversationId: command.conversationId,
      senderId: command.senderId.trim(),
      content: command.content,
      timestamp: new Date(),
      metadata: command.metadata,
    };

    return this.messageRepository.save(message);
  }
}
