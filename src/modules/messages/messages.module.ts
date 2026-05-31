import { Module } from '@nestjs/common';
import { CreateMessageUseCase } from './application/use-cases/create-message.use-case';
import { GetConversationMessagesUseCase } from './application/use-cases/get-conversation-messages.use-case';
import { SearchConversationMessagesUseCase } from './application/use-cases/search-conversation-messages.use-case';
import { MessagesController } from './presentation/controllers/messages.controller';
import { InMemoryMessageRepository } from './infrastructure/repositories/in-memory-message.repository';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository';

@Module({
  controllers: [MessagesController],
  providers: [
    CreateMessageUseCase,
    GetConversationMessagesUseCase,
    SearchConversationMessagesUseCase,
    {
      provide: MESSAGE_REPOSITORY,
      useClass: InMemoryMessageRepository,
    },
  ],
})
export class MessagesModule {}
