import { PaginatedMessages } from '../repositories/message.repository';

export const MESSAGE_SEARCH_READER = Symbol('MESSAGE_SEARCH_READER');

export interface MessageSearchReader {
  searchByConversationId(
    conversationId: string,
    searchTerm: string,
    page: number,
    limit: number,
  ): Promise<PaginatedMessages>;
}
