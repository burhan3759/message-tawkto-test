export type CreateMessageCommand = {
  conversationId: string;
  content: string;
  senderId: string;
  metadata?: Record<string, unknown>;
};
