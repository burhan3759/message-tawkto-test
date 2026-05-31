import { Message } from '../entities/message.entity';

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');

export interface MessageRepository {
  save(message: Message): Promise<Message>;
}
