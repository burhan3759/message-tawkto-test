# GitHub Copilot System Instructions: Tawkify Message Management API

## 1. Project Context & High-Level Execution Strategy
- **Goal**: Build scalable, clean, and stable RESTful APIs for message management.
- **Development Philosophy**: **Keep it simple and don't over-engineer.** Focus entirely on satisfying the core functional requirements with clean, direct implementations. Avoid deep inheritance hierarchies, unnecessary utility helpers, or premature optimizations.
- **Architectural Pillars**: 
  - **Domain-Driven Design (DDD)**: Pragmatic separation of core business concepts from external infrastructure.
  - **Event-Driven Architecture (EDA)**: Decentralized event flow utilizing a message broker.
  - **Multi-Tenant Systems**: Design structures to handle data partitioning safely.
  - **SOLID Principles**: Adhere to clean code patterns and proper abstraction boundary interfaces.

## 2. Technical Stack Configuration
- **Framework**: NestJS (REST API)
- **Primary Data Store**: MongoDB
- **Message Broker**: Kafka
- **Search Engine**: Elasticsearch

## 3. Core Data Domain (Message Schema)
Adhere strictly to this structural layout for the Message entity:
```typescript
type Message = {
  id: string; // Map MongoDB ObjectId/UUID to string
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};
