import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateMessageUseCase } from './application/use-cases/create-message.use-case';
import { GetConversationMessagesUseCase } from './application/use-cases/get-conversation-messages.use-case';
import { SearchConversationMessagesUseCase } from './application/use-cases/search-conversation-messages.use-case';
import { MESSAGE_EVENT_PUBLISHER } from './domain/events/message-event-publisher';
import { MESSAGE_EVENT_INDEXER } from './domain/search/message-event-indexer';
import { MESSAGE_SEARCH_READER } from './domain/search/message-search.reader';
import { MessagesController } from './presentation/controllers/messages.controller';
import { KafkaMessageCreatedSubscriber } from './infrastructure/events/kafka-message-created.subscriber';
import { KafkaMessageEventPublisher } from './infrastructure/events/kafka-message-event.publisher';
import { MongoMessageRepository } from './infrastructure/repositories/mongo-message.repository';
import { ElasticsearchMessageSearchService } from './infrastructure/search/elasticsearch-message-search.service';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository';

@Module({
  imports: [AuthModule],
  controllers: [MessagesController],
  providers: [
    CreateMessageUseCase,
    GetConversationMessagesUseCase,
    SearchConversationMessagesUseCase,
    ElasticsearchMessageSearchService,
    {
      provide: MESSAGE_REPOSITORY,
      useClass: MongoMessageRepository,
    },
    {
      provide: MESSAGE_EVENT_PUBLISHER,
      useClass: KafkaMessageEventPublisher,
    },
    {
      provide: MESSAGE_SEARCH_READER,
      useExisting: ElasticsearchMessageSearchService,
    },
    {
      provide: MESSAGE_EVENT_INDEXER,
      useExisting: ElasticsearchMessageSearchService,
    },
    {
      provide: KafkaMessageCreatedSubscriber,
      useClass: KafkaMessageCreatedSubscriber,
    },
  ],
})
export class MessagesModule {}
