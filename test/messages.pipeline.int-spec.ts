import 'dotenv/config';
import { Client } from '@elastic/elasticsearch';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Kafka, Producer } from 'kafkajs';
import request from 'supertest';

const runPipelineE2E = process.env.RUN_PIPELINE_E2E === 'true';
const describeIfEnabled = runPipelineE2E ? describe : describe.skip;

describeIfEnabled('Message Pipeline (Kafka -> Elasticsearch)', () => {
  jest.setTimeout(60000);

  let app: INestApplication;
  let accessToken: string;
  let elasticsearchClient: Client;
  let indexName: string;
  let kafkaProducer: Producer;
  let messageCreatedTopic: string;

  const wait = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  beforeAll(async () => {
    const elasticsearchNode = process.env.ELASTICSEARCH_NODE;
    const elasticsearchIndexMessages = process.env.ELASTICSEARCH_INDEX_MESSAGES;
    const kafkaBrokers = process.env.KAFKA_BROKERS;
    const kafkaClientId = process.env.KAFKA_CLIENT_ID;
    const kafkaTopicMessageCreated = process.env.KAFKA_TOPIC_MESSAGE_CREATED;

    if (!elasticsearchNode) {
      throw new Error('ELASTICSEARCH_NODE is required for pipeline E2E test');
    }

    if (!elasticsearchIndexMessages) {
      throw new Error(
        'ELASTICSEARCH_INDEX_MESSAGES is required for pipeline E2E test',
      );
    }

    if (!kafkaBrokers) {
      throw new Error('KAFKA_BROKERS is required for pipeline E2E test');
    }

    if (!kafkaClientId) {
      throw new Error('KAFKA_CLIENT_ID is required for pipeline E2E test');
    }

    if (!kafkaTopicMessageCreated) {
      throw new Error(
        'KAFKA_TOPIC_MESSAGE_CREATED is required for pipeline E2E test',
      );
    }

    indexName = elasticsearchIndexMessages;
    elasticsearchClient = new Client({ node: elasticsearchNode });
    messageCreatedTopic = kafkaTopicMessageCreated;

    const kafka = new Kafka({
      clientId: `${kafkaClientId}-pipeline-e2e`,
      brokers: kafkaBrokers
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    });

    kafkaProducer = kafka.producer();
    await kafkaProducer.connect();

    const { AppModule } = await import('../src/app.module');
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
    await kafkaProducer.disconnect();
    await wait(1000);
  });

  it('indexes created message through Kafka and returns it from Elasticsearch-backed search', async () => {
    const token = Date.now().toString();
    const conversationId = `pipeline-conv-${token}`;
    const uniqueTerm = `term-${token}`;
    const senderId = `user-pipeline-${token}`;

    let createdMessageId: string | undefined;

    const createResponse = await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        conversationId,
        content: `hello ${uniqueTerm} from pipeline`,
        senderId,
      })
      .expect(201);

    createdMessageId = createResponse.body.id;

    let found = false;
    let latestSearchResponse: request.Response | undefined;

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const response = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages/search`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: uniqueTerm, page: 1, limit: 10 })
        .expect(200);

      latestSearchResponse = response;

      const hasMessage = response.body.data.some(
        (item: { content: string; senderId: string; id: string }) =>
          item.content.includes(uniqueTerm) &&
          item.senderId === senderId &&
          item.id === createdMessageId,
      );

      if (hasMessage) {
        found = true;
        break;
      }

      await wait(500);
    }

    expect(latestSearchResponse).toBeDefined();
    expect(found).toBe(true);

    let indexedDocument:
      | {
          id: string;
          conversationId: string;
          senderId: string;
          content: string;
          timestamp: string;
        }
      | undefined;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const elasticsearchResult = await elasticsearchClient.search<{
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        timestamp: string;
      }>({
        index: indexName,
        query: {
          bool: {
            must: [
              { match_phrase: { conversationId } },
              { match_phrase: { content: uniqueTerm } },
            ],
          },
        },
        size: 10,
      });

      indexedDocument = elasticsearchResult.hits.hits
        .map((hit) => hit._source)
        .find(
          (source): source is NonNullable<typeof source> =>
            source !== undefined &&
            source.id === createdMessageId &&
            source.senderId === senderId,
        );

      if (indexedDocument) {
        break;
      }

      await wait(500);
    }

    expect(indexedDocument).toBeDefined();
    expect(indexedDocument?.id).toBe(createdMessageId);
    expect(indexedDocument?.conversationId).toBe(conversationId);
    expect(indexedDocument?.senderId).toBe(senderId);
    expect(indexedDocument?.content).toContain(uniqueTerm);

    const duplicateEvent = {
      eventName: 'message.created',
      eventVersion: 1,
      occurredAt: new Date().toISOString(),
      data: {
        id: createdMessageId,
        conversationId,
        senderId,
        content: `hello ${uniqueTerm} from pipeline`,
        timestamp: createResponse.body.timestamp,
      },
    };

    await kafkaProducer.send({
      topic: messageCreatedTopic,
      messages: [
        {
          key: conversationId,
          value: JSON.stringify(duplicateEvent),
        },
      ],
    });

    let dedupeCount = -1;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const duplicateCheckResult = await elasticsearchClient.search({
        index: indexName,
        query: {
          bool: {
            must: [
              { match_phrase: { conversationId } },
              { match_phrase: { senderId } },
              { match_phrase: { content: uniqueTerm } },
            ],
          },
        },
        size: 10,
      });

      dedupeCount =
        typeof duplicateCheckResult.hits.total === 'number'
          ? duplicateCheckResult.hits.total
          : (duplicateCheckResult.hits.total?.value ?? 0);

      if (dedupeCount === 1) {
        break;
      }

      await wait(500);
    }

    expect(dedupeCount).toBe(1);
  });
});
