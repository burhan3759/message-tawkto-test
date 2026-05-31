import { Inject, Injectable } from '@nestjs/common';
import {
  MESSAGE_REPOSITORY,
  MessageRepository,
} from '../../domain/repositories/message.repository';
import { MessageSearchReader } from '../../domain/search/message-search.reader';

@Injectable()
export class RepositoryMessageSearchReader implements MessageSearchReader {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  async searchByConversationId(
    tenantId: string,
    conversationId: string,
    searchTerm: string,
    page: number,
    limit: number,
  ) {
    return this.messageRepository.searchByConversationId(
      tenantId,
      conversationId,
      searchTerm,
      {
        page,
        limit,
      },
    );
  }
}
