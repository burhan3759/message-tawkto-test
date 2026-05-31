export type SearchConversationMessagesQuery = {
  tenantId: string;
  conversationId: string;
  q: string;
  page: number;
  limit: number;
};
