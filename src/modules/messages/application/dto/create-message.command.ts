export type CreateMessageCommand = {
  tenantId: string;
  conversationId: string;
  content: string;
  senderId: string;
  metadata?: Record<string, unknown>;
};
