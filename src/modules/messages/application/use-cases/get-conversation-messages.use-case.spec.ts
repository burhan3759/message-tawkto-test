import {
  MessageRepository,
  PaginatedMessages,
} from '../../domain/repositories/message.repository';
import { GetConversationMessagesUseCase } from './get-conversation-messages.use-case';

describe('GetConversationMessagesUseCase', () => {
  it('should retrieve conversation messages with pagination and sorting', async () => {
    const response: PaginatedMessages = {
      data: [
        {
          id: 'msg-1',
          tenantId: 'tenant-1',
          conversationId: 'conversation-1',
          senderId: 'user-1',
          content: 'hello',
          timestamp: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      meta: {
        page: 2,
        limit: 10,
        total: 21,
        totalPages: 3,
        sortOrder: 'asc',
      },
    };

    const findByConversationId = jest.fn(async () => response);
    const repository = { findByConversationId } as unknown as MessageRepository;
    const useCase = new GetConversationMessagesUseCase(repository);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      page: 2,
      limit: 10,
      sortOrder: 'asc',
    });

    expect(findByConversationId).toHaveBeenCalledTimes(1);
    expect(findByConversationId).toHaveBeenCalledWith(
      'tenant-1',
      'conversation-1',
      {
        page: 2,
        limit: 10,
        sortOrder: 'asc',
      },
    );
    expect(result).toEqual(response);
  });
});
