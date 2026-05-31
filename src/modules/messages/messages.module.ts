import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateMessageUseCase } from './application/use-cases/create-message.use-case';
import { GetConversationMessagesUseCase } from './application/use-cases/get-conversation-messages.use-case';
import { SearchConversationMessagesUseCase } from './application/use-cases/search-conversation-messages.use-case';
import { MessagesController } from './presentation/controllers/messages.controller';
import { MongoMessageRepository } from './infrastructure/repositories/mongo-message.repository';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository';

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
  ],
})
export class MessagesModule {}
