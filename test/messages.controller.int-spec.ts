import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MessagesController (integration)', () => {
  let app: INestApplication;

  const wait = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/messages creates a message', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/messages')
      .send({
        conversationId: 'conversation-1',
        content: 'Integration test message',
        senderId: 'user-123',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      conversationId: 'conversation-1',
      content: 'Integration test message',
      senderId: 'user-123',
    });
    expect(response.body.id).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });

  it('POST /api/messages returns 400 when required fields are missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/messages')
      .send({
        senderId: 'user-123',
      })
      .expect(400);

    expect(response.body.message).toContain('conversationId should not be empty');
    expect(response.body.message).toContain('content should not be empty');
  });

  it('GET /api/conversations/:conversationId/messages supports pagination and sorting', async () => {
    const conversationId = 'conversation-pagination-1';

    await request(app.getHttpServer()).post('/api/messages').send({
      conversationId,
      content: 'first',
      senderId: 'user-1',
    });
    await wait(5);

    await request(app.getHttpServer()).post('/api/messages').send({
      conversationId,
      content: 'second',
      senderId: 'user-1',
    });
    await wait(5);

    await request(app.getHttpServer()).post('/api/messages').send({
      conversationId,
      content: 'third',
      senderId: 'user-1',
    });

    const ascResponse = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages`)
      .query({ page: 1, limit: 2, sortOrder: 'asc' })
      .expect(200);

    expect(ascResponse.body.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      sortOrder: 'asc',
    });
    expect(ascResponse.body.data).toHaveLength(2);
    expect(ascResponse.body.data[0].content).toBe('first');
    expect(ascResponse.body.data[1].content).toBe('second');

    const descResponse = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages`)
      .query({ page: 1, limit: 2, sortOrder: 'desc' })
      .expect(200);

    expect(descResponse.body.meta.sortOrder).toBe('desc');
    expect(descResponse.body.data[0].content).toBe('third');
    expect(descResponse.body.data[1].content).toBe('second');
  });
});
