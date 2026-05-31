import 'dotenv/config';
import { Client } from '@elastic/elasticsearch';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { KafkaMessageCreatedSubscriber } from '../src/modules/messages/infrastructure/events/kafka-message-created.subscriber';

describe('MessagesController (integration)', () => {
  jest.setTimeout(60000);

  let app: INestApplication;
  let accessToken: string;
  let elasticsearchClient: Client;
  let elasticsearchIndexName: string;

  const wait = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const elasticsearchNode = process.env.ELASTICSEARCH_NODE;
    const indexName = process.env.ELASTICSEARCH_INDEX_MESSAGES;

    if (!elasticsearchNode) {
      throw new Error('ELASTICSEARCH_NODE is required for integration tests');
    }

    if (!indexName) {
      throw new Error(
        'ELASTICSEARCH_INDEX_MESSAGES is required for integration tests',
      );
    }

    elasticsearchClient = new Client({ node: elasticsearchNode });
    elasticsearchIndexName = indexName;

    const { AppModule } = await import('../src/app.module');
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(KafkaMessageCreatedSubscriber)
      .useValue({
        onModuleInit: async () => undefined,
        onModuleDestroy: async () => undefined,
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'demo',
        password: 'demo123',
      })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/messages creates a message', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${accessToken}`)
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
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        senderId: 'user-123',
      })
      .expect(400);

    expect(response.body.message).toContain('conversationId should not be empty');
    expect(response.body.message).toContain('content should not be empty');
  });

  it('POST /api/messages returns 400 when senderId is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        conversationId: 'conversation-validation-sender',
        content: 'content',
      })
      .expect(400);

    expect(response.body.message).toContain('senderId should not be empty');
  });

  it('GET /api/conversations/:conversationId/messages supports pagination and sorting', async () => {
    const conversationId = `conversation-pagination-${Date.now()}`;

    await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        conversationId,
        content: 'first',
        senderId: 'user-1',
      });
    await wait(5);

    await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        conversationId,
        content: 'second',
        senderId: 'user-1',
      });
    await wait(5);

    await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        conversationId,
        content: 'third',
        senderId: 'user-1',
      });

    const ascResponse = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
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
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 1, limit: 2, sortOrder: 'desc' })
      .expect(200);

    expect(descResponse.body.meta.sortOrder).toBe('desc');
    expect(descResponse.body.data[0].content).toBe('third');
    expect(descResponse.body.data[1].content).toBe('second');
  });

  it('GET /api/conversations/:conversationId/messages/search searches by q with pagination', async () => {
    const conversationId = `conversation-search-${Date.now()}`;

    const docs = [
      {
        id: `search-${Date.now()}-1`,
        conversationId,
        senderId: 'user-1',
        content: 'Hello alpha',
        timestamp: new Date(Date.now() - 2000).toISOString(),
      },
      {
        id: `search-${Date.now()}-2`,
        conversationId,
        senderId: 'user-1',
        content: 'beta content',
        timestamp: new Date(Date.now() - 1000).toISOString(),
      },
      {
        id: `search-${Date.now()}-3`,
        conversationId,
        senderId: 'user-1',
        content: 'HELLO gamma',
        timestamp: new Date().toISOString(),
      },
    ];

    for (const doc of docs) {
      await elasticsearchClient.index({
        index: elasticsearchIndexName,
        id: doc.id,
        document: doc,
      });
    }

    await elasticsearchClient.indices.refresh({
      index: elasticsearchIndexName,
    });

    let response: request.Response | undefined;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const currentResponse = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages/search`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: 'hello', page: 1, limit: 1 })
        .expect(200);

      response = currentResponse;

      if (currentResponse.body.meta.total >= 2) {
        break;
      }

      await wait(150);
    }

    expect(response).toBeDefined();
    expect(response!.body.meta.total).toBeGreaterThanOrEqual(2);

    expect(response!.body.meta).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
      sortOrder: 'desc',
    });
    expect(response!.body.data).toHaveLength(1);
    expect(response!.body.data[0].content).toBe('HELLO gamma');
    expect(response!.body.data[0].senderId).toBe('user-1');
  });

  it('GET /api/conversations/:conversationId/messages returns 400 for invalid pagination/sort values', async () => {
    const conversationId = `conversation-invalid-query-${Date.now()}`;

    const response = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 0, limit: 101, sortOrder: 'latest' })
      .expect(400);

    expect(response.body.message).toContain('page must not be less than 1');
    expect(response.body.message).toContain('limit must not be greater than 100');
    expect(response.body.message).toContain('sortOrder must be one of the following values: asc, desc');
  });

  it('GET /api/conversations/:conversationId/messages/search returns 400 for invalid pagination values', async () => {
    const conversationId = `conversation-invalid-search-${Date.now()}`;

    const response = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages/search`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ q: 'hello', page: 0, limit: 101 })
      .expect(400);

    expect(response.body.message).toContain('page must not be less than 1');
    expect(response.body.message).toContain('limit must not be greater than 100');
  });

  it('GET /api/conversations/:conversationId/messages/search returns 400 when q is missing', async () => {
    const conversationId = 'conversation-search-validation-1';

    const response = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages/search`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 1, limit: 10 })
      .expect(400);

    expect(response.body.message).toContain('q should not be empty');
  });

  it('GET /api/conversations/:conversationId/messages/search treats DSL-like q as plain text', async () => {
    const conversationId = `conversation-dsl-${Date.now()}`;
    const q = '{"match_all":{}}';

    const response = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages/search`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ q, page: 1, limit: 10 })
      .expect(200);

    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      sortOrder: 'desc',
    });
    expect(response.body.data).toEqual([]);
  });

  it('GET /api/conversations/:conversationId/messages/search sorts deterministically when timestamps are equal', async () => {
    const token = Date.now();
    const conversationId = `conversation-stable-sort-${token}`;
    const timestamp = new Date(token).toISOString();

    const docs = [
      {
        id: `stable-${token}-a`,
        conversationId,
        senderId: 'user-sort',
        content: 'stable sort term',
        timestamp,
      },
      {
        id: `stable-${token}-b`,
        conversationId,
        senderId: 'user-sort',
        content: 'stable sort term',
        timestamp,
      },
    ];

    for (const doc of docs) {
      await elasticsearchClient.index({
        index: elasticsearchIndexName,
        id: doc.id,
        document: doc,
      });
    }

    await elasticsearchClient.indices.refresh({
      index: elasticsearchIndexName,
    });

    const response = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages/search`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ q: 'stable sort term', page: 1, limit: 10 })
      .expect(200);

    expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
    expect(response.body.data[0].id).toBe(`stable-${token}-b`);
    expect(response.body.data[1].id).toBe(`stable-${token}-a`);
  });

  it('returns 401 when missing token on protected endpoint', async () => {
    await request(app.getHttpServer())
      .get('/api/conversations/any/messages')
      .query({ page: 1, limit: 10, sortOrder: 'desc' })
      .expect(401);
  });
});
