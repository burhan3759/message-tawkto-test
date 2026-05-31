import { Module } from '@nestjs/common';
import { CreateMessageUseCase } from './application/use-cases/create-message.use-case';
import { MessagesController } from './presentation/controllers/messages.controller';
import { InMemoryMessageRepository } from './infrastructure/repositories/in-memory-message.repository';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository';

@Module({
  controllers: [MessagesController],
  providers: [
    CreateMessageUseCase,
    {
      provide: MESSAGE_REPOSITORY,
      useClass: InMemoryMessageRepository,
    },
  ],
})
export class MessagesModule {}
