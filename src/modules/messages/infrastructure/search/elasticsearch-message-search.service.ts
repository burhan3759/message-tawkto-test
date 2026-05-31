import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { PaginatedMessages } from '../../domain/repositories/message.repository';
import {
  MessageCreatedEventData,
  MessageEventIndexer,
} from '../../domain/search/message-event-indexer';
import { MessageSearchReader } from '../../domain/search/message-search.reader';

type IndexedMessageDocument = {
  id: string;
  tenantId: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
};

@Injectable()
export class ElasticsearchMessageSearchService
  implements MessageSearchReader, MessageEventIndexer
{
  private readonly node: string;
  private readonly indexName: string;
  private readonly client: Client;
  private ensureIndexPromise?: Promise<void>;

  constructor() {
    const node = process.env.ELASTICSEARCH_NODE;
    const indexName = process.env.ELASTICSEARCH_INDEX_MESSAGES;

    if (!node) {
      throw new Error('ELASTICSEARCH_NODE is required');
    }

    if (!indexName) {
      throw new Error('ELASTICSEARCH_INDEX_MESSAGES is required');
    }

    this.node = node;
    this.indexName = indexName;
    this.client = new Client({ node: this.node });
  }

  private async ensureIndex(): Promise<void> {
    if (!this.ensureIndexPromise) {
      this.ensureIndexPromise = (async () => {
        const exists = await this.client.indices.exists({
          index: this.indexName,
        });

        if (!exists) {
          try {
            await this.client.indices.create({
              index: this.indexName,
              mappings: {
                properties: {
                  id: { type: 'keyword' },
                  tenantId: { type: 'keyword' },
                  conversationId: { type: 'keyword' },
                  senderId: { type: 'keyword' },
                  content: { type: 'text' },
                  timestamp: { type: 'date' },
                },
              },
            });
          } catch (error) {
            const maybeError = error as {
              meta?: { body?: { error?: { type?: string } } };
            };
            const errorType = maybeError.meta?.body?.error?.type;

            // Concurrent startup paths can race to create the same index.
            if (errorType !== 'resource_already_exists_exception') {
              throw error;
            }
          }
        }
      })();
    }

    await this.ensureIndexPromise;
  }

  async indexMessageCreated(eventData: MessageCreatedEventData): Promise<void> {
    await this.ensureIndex();

    const document: IndexedMessageDocument = {
      id: eventData.id,
      tenantId: eventData.tenantId,
      conversationId: eventData.conversationId,
      senderId: eventData.senderId,
      content: eventData.content,
      timestamp: eventData.timestamp,
    };

    await this.client.index({
      index: this.indexName,
      id: eventData.id,
      document,
    });
  }

  async searchByConversationId(
    tenantId: string,
    conversationId: string,
    searchTerm: string,
    page: number,
    limit: number,
  ): Promise<PaginatedMessages> {
    await this.ensureIndex();

    const from = (page - 1) * limit;
    const response = await this.client.search<IndexedMessageDocument>({
      index: this.indexName,
      from,
      size: limit,
      track_total_hits: true,
      query: {
        bool: {
          must: [
            { match_phrase: { tenantId } },
            { match_phrase: { conversationId } },
            {
              match: {
                content: {
                  query: searchTerm,
                  operator: 'and',
                },
              },
            },
          ],
        },
      },
      sort: [
        { timestamp: { order: 'desc' } },
        { id: { order: 'desc' } },
      ],
    });

    const totalHits =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : (response.hits.total?.value ?? 0);

    const totalPages = totalHits === 0 ? 0 : Math.ceil(totalHits / limit);

    return {
      data: response.hits.hits
        .map((hit) => hit._source)
        .filter(
          (
            source,
          ): source is IndexedMessageDocument => source !== undefined,
        )
        .map((source) => ({
          id: source.id,
          tenantId: source.tenantId,
          conversationId: source.conversationId,
          content: source.content,
          timestamp: new Date(source.timestamp),
          senderId: source.senderId,
        })),
      meta: {
        page,
        limit,
        total: totalHits,
        totalPages,
        sortOrder: 'desc',
      },
    };
  }
}
