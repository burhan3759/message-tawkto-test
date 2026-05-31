import {
  PaginatedMessages,
} from '../../domain/repositories/message.repository';
import { MessageSearchReader } from '../../domain/search/message-search.reader';
import { SearchConversationMessagesUseCase } from './search-conversation-messages.use-case';

describe('SearchConversationMessagesUseCase', () => {
  it('should search conversation messages with pagination', async () => {
    const response: PaginatedMessages = {
      data: [
        {
          id: 'msg-1',
          tenantId: 'tenant-1',
          conversationId: 'conversation-1',
          senderId: 'user-1',
          content: 'hello world',
          timestamp: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      meta: {
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
        sortOrder: 'desc',
      },
    };

    const searchByConversationId = jest.fn(async () => response);
    const searchReader = {
      searchByConversationId,
    } as MessageSearchReader;
    const useCase = new SearchConversationMessagesUseCase(searchReader);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      q: 'hello',
      page: 1,
      limit: 5,
    });

    expect(searchByConversationId).toHaveBeenCalledTimes(1);
    expect(searchByConversationId).toHaveBeenCalledWith(
      'tenant-1',
      'conversation-1',
      'hello',
      1,
      5,
    );
    expect(result).toEqual(response);
  });
});
