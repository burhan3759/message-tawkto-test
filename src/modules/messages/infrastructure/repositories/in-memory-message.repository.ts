import { Injectable } from '@nestjs/common';
import { Message } from '../../domain/entities/message.entity';
import {
  FindMessagesOptions,
  MessageRepository,
  PaginatedMessages,
  SearchMessagesOptions,
} from '../../domain/repositories/message.repository';

@Injectable()
export class InMemoryMessageRepository implements MessageRepository {
  private readonly messages: Message[] = [];

  private paginateAndSort(
    messages: Message[],
    options: FindMessagesOptions,
  ): PaginatedMessages {
    const sorted = messages.sort((a, b) => {
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

  async save(message: Message): Promise<Message> {
    this.messages.push(message);
    return message;
  }

  async findByConversationId(
    tenantId: string,
    conversationId: string,
    options: FindMessagesOptions,
  ): Promise<PaginatedMessages> {
    const filtered = this.messages.filter(
      (message) =>
        message.tenantId === tenantId &&
        message.conversationId === conversationId,
    );

    return this.paginateAndSort(filtered, options);
  }

  async searchByConversationId(
    tenantId: string,
    conversationId: string,
    searchTerm: string,
    options: SearchMessagesOptions,
  ): Promise<PaginatedMessages> {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = this.messages.filter((message) => {
      if (message.tenantId !== tenantId) {
        return false;
      }

      if (message.conversationId !== conversationId) {
        return false;
      }

      return message.content.toLowerCase().includes(normalizedSearch);
    });

    return this.paginateAndSort(filtered, {
      ...options,
      sortOrder: 'desc',
    });
  }
}
