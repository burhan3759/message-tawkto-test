# Kafka Topology

## Topic Design
- Topic: `messages.created.v1`
- Partitions: `6` (allows horizontal consumer scaling)
- Replication factor: `1` in local/dev (use `3` in production)
- Message key: `conversationId` (preserves per-conversation ordering)

## Consumer Groups
- `message-search-indexer-v1`: build/update search index
- `message-notification-dispatcher-v1`: send downstream notifications
- `message-analytics-pipeline-v1`: analytics and reporting

Each consumer group receives all events independently. Within a group, partitions are distributed among instances for scalability and fault tolerance.
