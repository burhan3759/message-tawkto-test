import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MessagesController (integration)', () => {
  let app: INestApplication;

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
});
