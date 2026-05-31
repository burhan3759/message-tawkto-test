import { Message } from '../../domain/entities/message.entity';
import { MessageRepository } from '../../domain/repositories/message.repository';
import { CreateMessageUseCase } from './create-message.use-case';

describe('CreateMessageUseCase', () => {
  it('should create and store a message', async () => {
    const save = jest.fn(async (message: Message) => message);
    const repository = { save } as unknown as MessageRepository;
    const useCase = new CreateMessageUseCase(repository);

    const result = await useCase.execute({
      conversationId: 'conversation-1',
      content: 'Hello world',
      senderId: ' user-1 ',
      metadata: { source: 'test' },
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(result.id).toBeDefined();
    expect(result.conversationId).toBe('conversation-1');
    expect(result.content).toBe('Hello world');
    expect(result.senderId).toBe('user-1');
    expect(result.metadata).toEqual({ source: 'test' });
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});
