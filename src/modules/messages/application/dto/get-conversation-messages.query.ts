import { MessageSortOrder } from '../../domain/repositories/message.repository';

export type GetConversationMessagesQuery = {
  conversationId: string;
  page: number;
  limit: number;
  sortOrder: MessageSortOrder;
};
