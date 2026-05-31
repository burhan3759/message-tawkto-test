export type MessageCreatedEvent = {
  eventName: 'message.created';
  eventVersion: 1;
  occurredAt: string;
  data: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    timestamp: string;
  };
};
