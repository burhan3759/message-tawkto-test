import { Inject, Injectable } from '@nestjs/common';
import { GetConversationMessagesQuery } from '../dto/get-conversation-messages.query';
import {
  MESSAGE_REPOSITORY,
  MessageRepository,
  PaginatedMessages,
} from '../../domain/repositories/message.repository';

@Injectable()
export class GetConversationMessagesUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(query: GetConversationMessagesQuery): Promise<PaginatedMessages> {
    return this.messageRepository.findByConversationId(query.conversationId, {
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
    });
  }
}
