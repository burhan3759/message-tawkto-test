import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

const runPipelineE2E = process.env.RUN_PIPELINE_E2E === 'true';
const describeIfEnabled = runPipelineE2E ? describe : describe.skip;

describeIfEnabled('Message Pipeline (Kafka -> Elasticsearch)', () => {
  let app: INestApplication;
  let accessToken: string;

  const wait = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  beforeAll(async () => {
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
  });

  it('indexes created message and returns it from Elasticsearch-backed search', async () => {
    const token = Date.now().toString();
    const conversationId = `pipeline-conv-${token}`;
    const uniqueTerm = `term-${token}`;

    await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        conversationId,
        content: `hello ${uniqueTerm} from pipeline`,
        senderId: 'user-pipeline',
      })
      .expect(201);

    let found = false;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages/search`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: uniqueTerm, page: 1, limit: 10 })
        .expect(200);

      const hasMessage = response.body.data.some(
        (item: { content: string }) => item.content.includes(uniqueTerm),
      );

      if (hasMessage) {
        found = true;
        break;
      }

      await wait(500);
    }

    expect(found).toBe(true);
  });
});
