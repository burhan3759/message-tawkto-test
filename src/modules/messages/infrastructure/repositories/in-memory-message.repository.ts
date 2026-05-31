import { Injectable } from '@nestjs/common';
import { Message } from '../../domain/entities/message.entity';
import { MessageRepository } from '../../domain/repositories/message.repository';

@Injectable()
export class InMemoryMessageRepository implements MessageRepository {
  private readonly messages: Message[] = [];

  async save(message: Message): Promise<Message> {
    this.messages.push(message);
    return message;
  }
}
