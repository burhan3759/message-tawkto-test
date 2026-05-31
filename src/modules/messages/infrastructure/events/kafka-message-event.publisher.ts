import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, logLevel } from 'kafkajs';
import { MessageCreatedEvent } from '../../domain/events/message-created.event';
import { MessageEventPublisher } from '../../domain/events/message-event-publisher';
import { Message } from '../../domain/entities/message.entity';

@Injectable()
export class KafkaMessageEventPublisher
  implements MessageEventPublisher, OnModuleDestroy
{
  private readonly topic: string;
  private readonly producer: Producer;
  private connectPromise?: Promise<void>;

  constructor() {
    const brokersRaw = process.env.KAFKA_BROKERS;
    const clientId = process.env.KAFKA_CLIENT_ID;
    const topic = process.env.KAFKA_TOPIC_MESSAGE_CREATED;

    if (!brokersRaw) {
      throw new Error('KAFKA_BROKERS is required');
    }

    if (!clientId) {
      throw new Error('KAFKA_CLIENT_ID is required');
    }

    if (!topic) {
      throw new Error('KAFKA_TOPIC_MESSAGE_CREATED is required');
    }

    const brokers = brokersRaw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (brokers.length === 0) {
      throw new Error('KAFKA_BROKERS must contain at least one broker');
    }

    const kafka = new Kafka({
      clientId,
      brokers,
      logLevel: logLevel.NOTHING,
    });

    this.topic = topic;
    this.producer = kafka.producer();
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connectPromise) {
      this.connectPromise = this.producer.connect();
    }

    await this.connectPromise;
  }

  async publishMessageCreated(message: Message): Promise<void> {
    await this.ensureConnected();

    const event: MessageCreatedEvent = {
      eventName: 'message.created',
      eventVersion: 1,
      occurredAt: new Date().toISOString(),
      data: {
        id: message.id,
        tenantId: message.tenantId,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
      },
    };

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: message.conversationId,
          value: JSON.stringify(event),
        },
      ],
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connectPromise) {
      await this.producer.disconnect();
    }
  }
}
