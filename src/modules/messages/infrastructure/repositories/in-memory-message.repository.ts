import { Injectable } from '@nestjs/common';
import { Message } from '../../domain/entities/message.entity';
import {
  FindMessagesOptions,
  MessageRepository,
  PaginatedMessages,
} from '../../domain/repositories/message.repository';

@Injectable()
export class InMemoryMessageRepository implements MessageRepository {
  private readonly messages: Message[] = [];

  async save(message: Message): Promise<Message> {
    this.messages.push(message);
    return message;
  }

  async findByConversationId(
    conversationId: string,
    options: FindMessagesOptions,
  ): Promise<PaginatedMessages> {
    const filtered = this.messages.filter(
      (message) => message.conversationId === conversationId,
    );

    const sorted = filtered.sort((a, b) => {
      const delta = a.timestamp.getTime() - b.timestamp.getTime();
      return options.sortOrder === 'asc' ? delta : -delta;
    });

    const total = sorted.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / options.limit);
    const start = (options.page - 1) * options.limit;
    const data = sorted.slice(start, start + options.limit);

    return {
      data,
      meta: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
        sortOrder: options.sortOrder,
      },
    };
  }
}
