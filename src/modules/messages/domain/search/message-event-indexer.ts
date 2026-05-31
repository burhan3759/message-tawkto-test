export const MESSAGE_EVENT_INDEXER = Symbol('MESSAGE_EVENT_INDEXER');

export type MessageCreatedEventData = {
  id: string;
  conversationId: string;
  content: string;
  timestamp: string;
};

export interface MessageEventIndexer {
  indexMessageCreated(eventData: MessageCreatedEventData): Promise<void>;
}
