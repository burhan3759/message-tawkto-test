# Tawkto Message Management API

A NestJS message management API using pragmatic DDD, MongoDB persistence, Kafka events, and Elasticsearch search.

## Architecture Decisions

### 1) Layered DDD Structure
- Domain layer holds core message/auth contracts and business entities.
- Application layer holds use-cases and DTOs.
- Infrastructure layer implements adapters (Mongo repository, Kafka publisher/subscriber, Elasticsearch search/indexer).
- Presentation layer exposes REST controllers and validation DTOs.

Reason:
- Keeps business logic decoupled from infrastructure and easier to test.

### 2) Event-Driven Search Indexing
- On message creation, the app stores to Mongo first.
- The app publishes `message.created` to Kafka.
- A Kafka subscriber consumes the event and indexes it into Elasticsearch.

Reason:
- Search path is read-optimized and decoupled from write path.
- Supports eventual consistency and scalable asynchronous processing.

### 3) Multi-Tenant Enforcement (Tenant-Scoped Queries)
- Tenant id is part of JWT payload.
- Tenant id is propagated through create/list/search use-cases.
- Mongo and Elasticsearch filters include tenant id.
- Kafka event payload includes tenant id so indexing remains tenant-safe.

Reason:
- Prevents cross-tenant leakage when conversation ids overlap across tenants.

### 4) Deterministic Sorting
- Mongo sorting includes timestamp + `_id` tie-breaker.
- Elasticsearch sorting includes timestamp + `id` tie-breaker.

Reason:
- Prevents unstable order when timestamps collide at millisecond precision.

### 5) Test Strategy
- Unit tests validate use-case behavior and failure propagation.
- Integration tests validate controller behavior and validation.
- Pipeline E2E integration validates app -> Kafka -> Elasticsearch flow.
- Dockerized test workflow runs tests against real infra containers.

## Tech Stack
- NestJS + TypeScript
- MongoDB
- Kafka (KRaft)
- Elasticsearch
- Kibana
- Jest + Supertest

## Project Structure
- `src/modules/auth` auth domain/use-cases/controllers/guards
- `src/modules/messages` message domain/use-cases/controllers/infrastructure
- `test` integration and pipeline tests
- `docker-compose.yml` local infrastructure
- `docker-compose.test.yml` dockerized test-runner

## Prerequisites
- Node.js 20+
- Yarn 1.22+
- Docker + Docker Compose

## Environment Setup
1. Copy env example:
   - `cp .env.example .env`
2. Ensure `.env` has valid values for app and infra keys.

Important keys in `.env`:
- App:
  - `NODE_ENV`
  - `JWT_SECRET`
  - `MONGODB_URI`
  - `MONGODB_DB_NAME`
  - `KAFKA_BROKERS`
  - `KAFKA_CLIENT_ID`
  - `KAFKA_TOPIC_MESSAGE_CREATED`
  - `KAFKA_CONSUMER_GROUP_MESSAGE_INDEXER`
  - `ELASTICSEARCH_NODE`
  - `ELASTICSEARCH_INDEX_MESSAGES`
- Compose infra:
  - `MONGO_ROOT_USERNAME`
  - `MONGO_ROOT_PASSWORD`
  - `MONGO_INITDB_DATABASE`
  - `MONGO_EXPRESS_BASICAUTH_USERNAME`
  - `MONGO_EXPRESS_BASICAUTH_PASSWORD`
  - `KAFKA_CLUSTER_ID`
  - `KAFKA_TOPIC_PARTITIONS`
  - `KAFKA_TOPIC_REPLICATION_FACTOR`

## Run Locally
1. Install dependencies:
   - `yarn install`
2. Start infrastructure:
   - `docker compose up -d`
3. Run app in dev mode:
   - `yarn start:dev`

## Build and Run
- Build: `yarn build`
- Run (ts-node): `yarn start`
- Run (compiled): `yarn start:prod`

## Test Commands
- All tests: `yarn test`
- Unit tests: `yarn test:unit`
- Integration tests: `yarn test:integration`
- Pipeline E2E only: `yarn test:pipeline:e2e`

### Dockerized Tests (Real Infra)
- Run dockerized test flow:
  - `yarn test:dockerized`
- Cleanup dockerized test resources:
  - `yarn test:dockerized:down`

## URLs
When `docker compose up -d` is running:
- API base: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- MongoDB: `mongodb://localhost:27017`
- Mongo Express: `http://localhost:8081`
- Kafka UI: `http://localhost:8080`
- Elasticsearch: `http://localhost:9200`
- Kibana: `http://localhost:5601`

## Authentication
Use login endpoint:
- `POST /api/auth/login`
- Demo users:
  - `demo` / `demo123` (tenant-1)
  - `demo2` / `demo123` (tenant-2)

Then send:
- `Authorization: Bearer <accessToken>`

## API Summary
- `POST /api/messages`
- `GET /api/conversations/:conversationId/messages`
- `GET /api/conversations/:conversationId/messages/search`

## Notes
- Search indexing is eventual consistency (Kafka + subscriber + Elasticsearch).
- If mappings changed and local Elasticsearch index is stale, reset index in dev before retesting.

## DEMO

This video features a complete walkthrough of the project, the integration of Swagger, MongoDB, Kafka, and Kibana for Elasticsearch.

https://github.com/user-attachments/assets/2b68f85d-9ca2-4750-9b1c-0a63458d3e41


