import { Message } from '../entities/message.entity';

export const MESSAGE_EVENT_PUBLISHER = Symbol('MESSAGE_EVENT_PUBLISHER');

export interface MessageEventPublisher {
  publishMessageCreated(message: Message): Promise<void>;
}
