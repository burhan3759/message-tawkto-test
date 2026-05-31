import { Injectable } from '@nestjs/common';
import { MessageEventPublisher } from '../../domain/events/message-event-publisher';
import { Message } from '../../domain/entities/message.entity';

@Injectable()
export class NoopMessageEventPublisher implements MessageEventPublisher {
  async publishMessageCreated(_: Message): Promise<void> {
    return;
  }
}
