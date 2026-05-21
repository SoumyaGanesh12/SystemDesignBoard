# SystemDesignBoard

A system design learning platform where we can drag infrastructure components onto a canvas, connect them to model data flow, and receive real-time validation and AI-powered architecture feedback.

Built for engineers who can write code but have never drawn a system diagram before.

## Architecture

```
┌──────────────┐       ┌───────────────────┐        ┌──────────────────┐
│   Frontend   │ REST  │    Node.js API    │ REST   │   Java Engine    │
│   React +    │─────> │   Express + TS    │──────> │  Spring Boot     │
│   TypeScript │<──────│                   │<────── │  Validation      │
└──────────────┘  SSE  │   ┌───────────┐   │        └────────┬─────────┘
                       │   │ Groq LLM  │   │                 │
                       │   │ (AI Chat) │   │                 │
                       │   └───────────┘   │                 │
                       │                   │        ┌────────▼─────────┐
                       │   Kafka Producer  │ ──────>│  Kafka Broker    │
                       │   Kafka Consumer  │<───────│    (Docker)      │
                       └───────────────────┘        └──────────────────┘
                                │
                       ┌────────▼─────────┐
                       │   PostgreSQL     │
                       │   (Design Store) │
                       └──────────────────┘
```

**Node.js** - I/O orchestration: API routing, LLM streaming, Kafka messaging, SSE connections.
**Java** - CPU-bound computation: graph traversal, rule-based validation.
**Kafka** - Decouples save flow from processing. Supports future consumers without modifying the producer.
**PostgreSQL** - Persists designs with versioning. Stores graph data as JSONB.

## User Flow

```
┌───────────┐     ┌───────────┐     ┌────────────┐     ┌───────────┐     ┌───────────┐
│  1. DRAG  │────>│2. CONNECT │────>│3. VALIDATE │────>│4. ANALYZE │────>│  5. SAVE  │
│           │     │           │     │            │     │           │     │           │
│ Drop      │     │ Draw      │     │-> Errors   │     │ AI streams│     │ Persists  │
│ components│     │ edges for │     │ on edges   │     │ feedback  │     │ to DB +   │
│ from      │     │ data flow │     │-> Warnings │     │ + chat    │     │ Kafka     │
│ palette   │     │           │     │ and panel  │     │ follow-up │     │ async     │
└───────────┘     └───────────┘     └────────────┘     └───────────┘     └───────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, React Flow |
| API Layer | Node.js, Express, TypeScript |
| Validation | Java 17, Spring Boot |
| Messaging | Apache Kafka |
| Database | PostgreSQL |
| AI | Groq API (Llama 3) |
| Deployment | Docker Compose, Nginx |

## Features

- **Drag-and-drop canvas** - 8 infrastructure components across 5 categories, serialized as a JSON graph of nodes and edges
- **Real-time validation** - 11 architecture rules covering reliability, scalability, separation of concerns, and performance with visual indicators on affected edges
- **AI advisor** - interactive chat powered by Groq LLM for architecture feedback with follow-up question support
- **Design persistence** - save, update, and load designs with version tracking using PostgreSQL
- **Design library** - browse, open, and manage all saved designs from a dashboard
- **Async processing pipeline** - design saves trigger Kafka events, processed by Java validation engine, results delivered via SSE
- **Data-driven rule registry** - new validation rules added through configuration without code changes
- **Fully containerized** - all services run in Docker with health checks and orchestrated startup

## Validation Rules

| Rule | Severity |
|------|----------|
| Direct client-to-database connection | ERROR |
| Circular dependency between components | ERROR |
| CDN connected to database | ERROR |
| Client directly to message queue | ERROR |
| Load balancer connected to database | ERROR |
| Message queue connected to client | ERROR |
| Multiple servers without load balancer | WARNING |
| Load balancer with single target | WARNING |
| Multiple clients without API gateway | WARNING |
| Server connected to CDN | WARNING |
| No cache between server and database | WARNING |

## Getting Started

### Prerequisites

- Node.js 18+
- Java 17+
- Docker and Docker Compose
- Groq API key - [console.groq.com](https://console.groq.com)

### Run with Docker (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/SystemDesignBoard.git
cd SystemDesignBoard

# 2. Set up environment variables
cp .env.example .env
# Add your Groq API key to .env

# 3. Start everything
docker-compose up --build
```

Open [http://localhost](http://localhost)

Services: Frontend (port 80), Node.js API (port 3000), Java API (port 8080)

### Run locally (development)

```bash
# 1. Start infrastructure
docker-compose up -d kafka zookeeper postgres kafka-init

# 2. Java backend (port 8080)
cd backend-java
./mvnw spring-boot:run

# 3. Node.js backend (port 3000)
cd backend-node
npm install
cp .env.example .env    # Add your Groq API key
npm run dev

# 4. Frontend (port 5173)
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## API Endpoints

**Node.js - port 3000**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/validate | Validate architecture graph |
| GET | /api/validate/rules | List all validation rules |
| POST | /api/analyze | AI analysis with streaming |
| POST | /api/design/save | Save design, publish to Kafka |
| GET | /api/design/events/:id | SSE for async results |

**Java - port 8080**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/validate | Validate architecture graph |
| GET | /api/validate/rules | List all validation rules |

## Project Structure

```
SystemDesignBoard/
├── frontend/                  # React + TypeScript + Vite + Nginx
│   ├── src/
│   │   ├── components/        # Canvas, Palette, ValidationPanel, AIAdvisor,
│   │   │                      # SaveDesign, DesignLibrary
│   │   ├── config/            # API configuration
│   │   ├── data/              # Component definitions
│   │   └── types/             # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend-node/              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/            # Environment, database, Kafka, logger
│   │   ├── kafka/             # Producer and consumer
│   │   ├── routes/            # validate, analyze, design
│   │   └── services/          # Design service (business logic)
│   └── Dockerfile
│
├── backend-java/              # Java 17 + Spring Boot
│   ├── src/main/java/
│   │   ├── config/            # Kafka configuration
│   │   ├── controller/        # REST endpoints
│   │   ├── dto/               # Request/response objects
│   │   ├── kafka/             # Event consumer
│   │   ├── model/             # Domain models
│   │   └── service/           # Validation logic and rule registry
│   └── Dockerfile
│
├── docker-compose.yml         # Full stack orchestration
└── .env.example               # Environment variable template
```

## Upcoming

- Custom nodes - editable labels, category-based styling
- AI agent - auto-generate designs from text descriptions
- Design version history - compare changes across saves