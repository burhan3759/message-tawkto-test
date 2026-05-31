import { Inject, Injectable } from '@nestjs/common';
import { SearchConversationMessagesQuery } from '../dto/search-conversation-messages.query';
import {
  PaginatedMessages,
} from '../../domain/repositories/message.repository';
import {
  MESSAGE_SEARCH_READER,
  MessageSearchReader,
} from '../../domain/search/message-search.reader';

@Injectable()
export class SearchConversationMessagesUseCase {
  constructor(
    @Inject(MESSAGE_SEARCH_READER)
    private readonly messageSearchReader: MessageSearchReader,
  ) {}

  async execute(
    query: SearchConversationMessagesQuery,
  ): Promise<PaginatedMessages> {
    return this.messageSearchReader.searchByConversationId(
      query.tenantId,
      query.conversationId,
      query.q,
      query.page,
      query.limit,
    );
  }
}
