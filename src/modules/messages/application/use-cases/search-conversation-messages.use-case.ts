import { Inject, Injectable } from '@nestjs/common';
import { SearchConversationMessagesQuery } from '../dto/search-conversation-messages.query';
import {
  MESSAGE_REPOSITORY,
  MessageRepository,
  PaginatedMessages,
} from '../../domain/repositories/message.repository';

@Injectable()
export class SearchConversationMessagesUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(
    query: SearchConversationMessagesQuery,
  ): Promise<PaginatedMessages> {
    return this.messageRepository.searchByConversationId(
      query.conversationId,
      query.q,
      {
        page: query.page,
        limit: query.limit,
      },
    );
  }
}
