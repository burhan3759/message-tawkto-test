import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka, logLevel } from 'kafkajs';
import {
  MESSAGE_EVENT_INDEXER,
  MessageEventIndexer,
} from '../../domain/search/message-event-indexer';
import { Inject } from '@nestjs/common';

type MessageCreatedEvent = {
  eventName: 'message.created';
  eventVersion: number;
  occurredAt: string;
  data: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    timestamp: string;
  };
};

@Injectable()
export class KafkaMessageCreatedSubscriber
  implements OnModuleInit, OnModuleDestroy
{
  private readonly topic: string;
  private readonly consumer: Consumer;
  private runPromise?: Promise<void>;

  constructor(
    @Inject(MESSAGE_EVENT_INDEXER)
    private readonly messageEventIndexer: MessageEventIndexer,
  ) {
    const brokersRaw = process.env.KAFKA_BROKERS;
    const clientId = process.env.KAFKA_CLIENT_ID;
    const topic = process.env.KAFKA_TOPIC_MESSAGE_CREATED;
    const groupId = process.env.KAFKA_CONSUMER_GROUP_MESSAGE_INDEXER;

    if (!brokersRaw) {
      throw new Error('KAFKA_BROKERS is required');
    }

    if (!clientId) {
      throw new Error('KAFKA_CLIENT_ID is required');
    }

    if (!topic) {
      throw new Error('KAFKA_TOPIC_MESSAGE_CREATED is required');
    }

    if (!groupId) {
      throw new Error('KAFKA_CONSUMER_GROUP_MESSAGE_INDEXER is required');
    }

    const brokers = brokersRaw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (brokers.length === 0) {
      throw new Error('KAFKA_BROKERS must contain at least one broker');
    }

    const kafka = new Kafka({
      clientId: `${clientId}-indexer`,
      brokers,
      logLevel: logLevel.NOTHING,
    });

    this.topic = topic;
    this.consumer = kafka.consumer({ groupId });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });

    this.runPromise = this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          return;
        }

        const payload = JSON.parse(message.value.toString()) as MessageCreatedEvent;

        if (payload.eventName !== 'message.created') {
          return;
        }

        await this.messageEventIndexer.indexMessageCreated(payload.data);
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.runPromise) {
      await this.consumer.stop();
    }

    await this.consumer.disconnect();
  }
}
