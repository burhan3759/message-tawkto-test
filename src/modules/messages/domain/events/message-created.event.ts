export type MessageCreatedEvent = {
  eventName: 'message.created';
  eventVersion: 1;
  occurredAt: string;
  data: {
    id: string;
    conversationId: string;
    content: string;
    timestamp: string;
  };
};
