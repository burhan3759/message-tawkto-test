export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
};
