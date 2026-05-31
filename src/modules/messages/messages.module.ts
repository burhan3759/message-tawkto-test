import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateMessageUseCase } from './application/use-cases/create-message.use-case';
import { GetConversationMessagesUseCase } from './application/use-cases/get-conversation-messages.use-case';
import { SearchConversationMessagesUseCase } from './application/use-cases/search-conversation-messages.use-case';
import { MESSAGE_EVENT_PUBLISHER } from './domain/events/message-event-publisher';
import { MessagesController } from './presentation/controllers/messages.controller';
import { KafkaMessageEventPublisher } from './infrastructure/events/kafka-message-event.publisher';
import { NoopMessageEventPublisher } from './infrastructure/events/noop-message-event.publisher';
import { MongoMessageRepository } from './infrastructure/repositories/mongo-message.repository';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository';

const messageEventPublisherProviderClass =
  process.env.NODE_ENV === 'test'
    ? NoopMessageEventPublisher
    : KafkaMessageEventPublisher;

@Module({
  imports: [AuthModule],
  controllers: [MessagesController],
  providers: [
    CreateMessageUseCase,
    GetConversationMessagesUseCase,
    SearchConversationMessagesUseCase,
    {
      provide: MESSAGE_REPOSITORY,
      useClass: MongoMessageRepository,
    },
    {
      provide: MESSAGE_EVENT_PUBLISHER,
      useClass: messageEventPublisherProviderClass,
    },
  ],
})
export class MessagesModule {}
