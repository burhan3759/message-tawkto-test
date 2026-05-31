import { MessageSortOrder } from '../../domain/repositories/message.repository';

export type GetConversationMessagesQuery = {
  tenantId: string;
  conversationId: string;
  page: number;
  limit: number;
  sortOrder: MessageSortOrder;
};
