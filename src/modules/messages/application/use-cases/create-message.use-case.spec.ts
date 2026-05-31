import { Message } from '../../domain/entities/message.entity';
import { MessageEventPublisher } from '../../domain/events/message-event-publisher';
import { MessageRepository } from '../../domain/repositories/message.repository';
import { CreateMessageUseCase } from './create-message.use-case';

describe('CreateMessageUseCase', () => {
  it('should create and store a message', async () => {
    const save = jest.fn(async (message: Message) => message);
    const publishMessageCreated = jest.fn(async () => undefined);
    const repository = { save } as unknown as MessageRepository;
    const eventPublisher = {
      publishMessageCreated,
    } as MessageEventPublisher;
    const useCase = new CreateMessageUseCase(repository, eventPublisher);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      content: 'Hello world',
      senderId: ' user-1 ',
      metadata: { source: 'test' },
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(publishMessageCreated).toHaveBeenCalledTimes(1);
    expect(publishMessageCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        conversationId: 'conversation-1',
        content: 'Hello world',
      }),
    );
    expect(result.id).toBeDefined();
    expect(result.tenantId).toBe('tenant-1');
    expect(result.conversationId).toBe('conversation-1');
    expect(result.content).toBe('Hello world');
    expect(result.senderId).toBe('user-1');
    expect(result.metadata).toEqual({ source: 'test' });
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should publish the persisted message returned by repository', async () => {
    const persistedMessage: Message = {
      id: 'persisted-id',
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      senderId: 'user-1',
      content: 'Hello world',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      metadata: { source: 'repo' },
    };

    const save = jest.fn(async () => persistedMessage);
    const publishMessageCreated = jest.fn(async () => undefined);
    const repository = { save } as unknown as MessageRepository;
    const eventPublisher = {
      publishMessageCreated,
    } as MessageEventPublisher;
    const useCase = new CreateMessageUseCase(repository, eventPublisher);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      conversationId: 'conversation-1',
      content: 'Hello world',
      senderId: 'user-1',
    });

    expect(publishMessageCreated).toHaveBeenCalledWith(persistedMessage);
    expect(result).toBe(persistedMessage);
  });

  it('should propagate publisher failure after persisting message', async () => {
    const save = jest.fn(async (message: Message) => message);
    const publishMessageCreated = jest.fn(async () => {
      throw new Error('kafka unavailable');
    });

    const repository = { save } as unknown as MessageRepository;
    const eventPublisher = {
      publishMessageCreated,
    } as MessageEventPublisher;
    const useCase = new CreateMessageUseCase(repository, eventPublisher);

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        conversationId: 'conversation-1',
        content: 'Hello world',
        senderId: 'user-1',
      }),
    ).rejects.toThrow('kafka unavailable');

    expect(save).toHaveBeenCalledTimes(1);
    expect(publishMessageCreated).toHaveBeenCalledTimes(1);
  });
});
