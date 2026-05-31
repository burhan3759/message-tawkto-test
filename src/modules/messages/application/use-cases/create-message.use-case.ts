import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateMessageCommand } from '../dto/create-message.command';
import { Message } from '../../domain/entities/message.entity';
import {
  MESSAGE_EVENT_PUBLISHER,
  MessageEventPublisher,
} from '../../domain/events/message-event-publisher';
import {
  MESSAGE_REPOSITORY,
  MessageRepository,
} from '../../domain/repositories/message.repository';

@Injectable()
export class CreateMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(MESSAGE_EVENT_PUBLISHER)
    private readonly messageEventPublisher: MessageEventPublisher,
  ) {}

  async execute(command: CreateMessageCommand): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      tenantId: command.tenantId,
      conversationId: command.conversationId,
      senderId: command.senderId.trim(),
      content: command.content,
      timestamp: new Date(),
      metadata: command.metadata,
    };

    const savedMessage = await this.messageRepository.save(message);
    await this.messageEventPublisher.publishMessageCreated(savedMessage);

    return savedMessage;
  }
}
