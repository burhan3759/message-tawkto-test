import { Message } from '../entities/message.entity';

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');

export type MessageSortOrder = 'asc' | 'desc';

export type FindMessagesOptions = {
  page: number;
  limit: number;
  sortOrder: MessageSortOrder;
};

export type PaginatedMessages = {
  data: Message[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    sortOrder: MessageSortOrder;
  };
};

export interface MessageRepository {
  save(message: Message): Promise<Message>;
  findByConversationId(
    conversationId: string,
    options: FindMessagesOptions,
  ): Promise<PaginatedMessages>;
}
