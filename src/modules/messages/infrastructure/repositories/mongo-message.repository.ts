import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Collection, MongoClient, ObjectId } from 'mongodb';
import { Message } from '../../domain/entities/message.entity';
import {
  FindMessagesOptions,
  MessageRepository,
  PaginatedMessages,
  SearchMessagesOptions,
} from '../../domain/repositories/message.repository';

type MessageDocument = {
  _id: ObjectId;
  tenantId: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
};

type MessageInsertDocument = Omit<MessageDocument, '_id'>;

@Injectable()
export class MongoMessageRepository implements MessageRepository, OnModuleDestroy {
  private readonly uri: string;
  private readonly dbName: string;
  private readonly client: MongoClient;
  private collectionPromise?: Promise<Collection<MessageDocument>>;

  constructor() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;

    if (!uri) {
      throw new Error('MONGODB_URI is required');
    }

    if (!dbName) {
      throw new Error('MONGODB_DB_NAME is required');
    }

    this.uri = uri;
    this.dbName = dbName;
    this.client = new MongoClient(this.uri);
  }

  private async getCollection(): Promise<Collection<MessageDocument>> {
    if (!this.collectionPromise) {
      this.collectionPromise = (async () => {
        await this.client.connect();
        const collection = this.client
          .db(this.dbName)
          .collection<MessageDocument>('messages');

        await collection.createIndex({
          tenantId: 1,
          conversationId: 1,
          timestamp: -1,
        });
        await collection.createIndex({
          tenantId: 1,
          conversationId: 1,
          content: 1,
        });

        return collection;
      })();
    }

    return this.collectionPromise;
  }

  private toEntity(document: MessageDocument): Message {
    return {
      id: document._id.toHexString(),
      tenantId: document.tenantId,
      conversationId: document.conversationId,
      senderId: document.senderId,
      content: document.content,
      timestamp: new Date(document.timestamp),
      metadata: document.metadata,
    };
  }

  private toPaginatedResult(
    documents: MessageDocument[],
    page: number,
    limit: number,
    total: number,
    sortOrder: 'asc' | 'desc',
  ): PaginatedMessages {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: documents.map((document) => this.toEntity(document)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        sortOrder,
      },
    };
  }

  async save(message: Message): Promise<Message> {
    const collection = await this.getCollection();

    const insertDocument: MessageInsertDocument = {
      tenantId: message.tenantId,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      timestamp: message.timestamp,
      metadata: message.metadata,
    };

    const result = await collection.insertOne(
      insertDocument as unknown as MessageDocument,
    );

    return {
      ...message,
      id: result.insertedId.toHexString(),
    };
  }

  async findByConversationId(
    tenantId: string,
    conversationId: string,
    options: FindMessagesOptions,
  ): Promise<PaginatedMessages> {
    const collection = await this.getCollection();
    const filter = { tenantId, conversationId };

    const total = await collection.countDocuments(filter);
    const documents = await collection
      .find(filter)
      .sort({
        timestamp: options.sortOrder === 'asc' ? 1 : -1,
        _id: options.sortOrder === 'asc' ? 1 : -1,
      })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .toArray();

    return this.toPaginatedResult(
      documents,
      options.page,
      options.limit,
      total,
      options.sortOrder,
    );
  }

  async searchByConversationId(
    tenantId: string,
    conversationId: string,
    searchTerm: string,
    options: SearchMessagesOptions,
  ): Promise<PaginatedMessages> {
    const collection = await this.getCollection();
    const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const filter = {
      tenantId,
      conversationId,
      content: { $regex: escapedSearch, $options: 'i' },
    };

    const total = await collection.countDocuments(filter);
    const documents = await collection
      .find(filter)
      .sort({ timestamp: -1, _id: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .toArray();

    return this.toPaginatedResult(documents, options.page, options.limit, total, 'desc');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }
}
