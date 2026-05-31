export type MessageCreatedEvent = {
  eventName: 'message.created';
  eventVersion: 1;
  occurredAt: string;
  data: {
    id: string;
    tenantId: string;
    conversationId: string;
    senderId: string;
    content: string;
    timestamp: string;
  };
};
