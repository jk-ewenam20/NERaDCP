# Emergency Response & Dispatch Coordination Platform

## Full Project Plan — All Phases

---

## Stack Decision: MERN

**Is MERN feasible? Yes — and well-suited for this project.**

| Need                                 | MERN Solution                               |
| ------------------------------------ | ------------------------------------------- |
| Geospatial nearest-responder queries | MongoDB `2dsphere` index + `$near` operator |
| Real-time vehicle tracking           | Node.js + Socket.io (WebSockets)            |
| Map UI + location picker             | React + Google Maps JavaScript API          |
| REST APIs for microservices          | Express.js                                  |
| Flexible incident/responder schemas  | MongoDB (schema-less, easy to extend)       |
| JWT auth across services             | `jsonwebtoken` + `express-jwt`              |

---

## Microservice Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React App)                           │
│   Admin Dashboard | Map View | Analytics | Incident Form            │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP / WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (nginx / Express)                    │
│            Port 3000 — Routes, Rate Limiting, CORS                  │
└──────┬──────────┬────────────┬───────────────┬──────────────────────┘
       │          │            │               │
       ▼          ▼            ▼               ▼
  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  Auth   │ │Responder │ │Incident  │ │Analytics │
  │Service  │ │ Mgmt     │ │ Service  │ │ Service  │
  │Port 3001│ │ Service  │ │Port 3003 │ │Port 3005 │
  │         │ │Port 3002 │ │          │ │          │
  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
       │           │            │             │
  ┌────▼────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
  │ MongoDB │ │ MongoDB  │ │ MongoDB  │ │ MongoDB  │
  │auth_db  │ │responder │ │incident  │ │analytics │
  │         │ │   _db    │ │   _db    │ │   _db    │
  └─────────┘ └──────────┘ └──────────┘ └──────────┘

                      ┌───────────────────────┐
                      │  Dispatch & Tracking  │
                      │  Service  Port 3004   │
                      │  (WebSocket + HTTP)   │
                      └──────────┬────────────┘
                                 │
                            ┌────▼─────┐
                            │ MongoDB  │
                            │tracking  │
                            │   _db    │
                            └──────────┘

  ┌────────────────────────────────────────────────────┐
  │              RabbitMQ Message Broker               │
  │                    Port 5672                       │
  │  Exchanges: incident.events, tracking.events       │
  └────────────────────────────────────────────────────┘
```

---

## The 5 Microservices

### 1. Auth Service (Port 3001)

Manages all system users and authentication. Issues JWT tokens.

### 2. Responder Management Service (Port 3002)

Manages all emergency responders and their assets:

- Hospitals (beds, capacity)
- Ambulances (attached to hospitals)
- Police Stations and Officers
- Fire Service Stations and Personnel

_Why a separate service?_ Hospital admins, police station admins, and fire service admins each manage their own resources. This service owns that data and exposes it so the Incident Service can query for nearest available responders.

### 3. Incident Service (Port 3003)

Records incidents, computes nearest responders using geospatial queries, manages dispatch, and tracks incident status lifecycle.

### 4. Dispatch & Tracking Service (Port 3004)

Maintains real-time GPS positions of vehicles. Exposes WebSocket connections for live map updates in the dashboard.

### 5. Analytics Service (Port 3005)

Aggregates data from other services (via RabbitMQ events) to generate operational insights.

---

## Message Queue Design (RabbitMQ)

### Exchange: `incident.events` (type: topic)

| Routing Key               | Publisher        | Subscriber(s)               | Purpose                      |
| ------------------------- | ---------------- | --------------------------- | ---------------------------- |
| `incident.created`        | Incident Service | Analytics Service           | Log new incident             |
| `incident.dispatched`     | Incident Service | Tracking Service, Analytics | Start tracking, log dispatch |
| `incident.resolved`       | Incident Service | Analytics Service           | Compute response time        |
| `incident.status_changed` | Incident Service | Analytics Service           | General status updates       |

### Exchange: `tracking.events` (type: topic)

| Routing Key                | Publisher        | Subscriber(s)     | Purpose                             |
| -------------------------- | ---------------- | ----------------- | ----------------------------------- |
| `vehicle.location_updated` | Tracking Service | Analytics Service | Aggregate location data             |
| `vehicle.arrived`          | Tracking Service | Incident Service  | Auto-update incident to In Progress |

---

## Phase Timeline

| Phase   | Deliverable                                                                                |
| ------- | ------------------------------------------------------------------------------------------ |
| Phase 1 | System Design (this document set)                                                          |
| Phase 2 | Backend — Auth Service first, then Responder, then Incident, then Tracking, then Analytics |
| Phase 3 | React frontend + Google Maps integration                                                   |
| Phase 4 | Docs (Swagger), Docker setup, demo video                                                   |

---

## Phase 2 — Backend Build Order

Build in this order to manage dependencies:

1. **Auth Service** — Everything else depends on JWT verification
2. **Responder Management Service** — Incident Service needs to query this
3. **Incident Service** — Core business logic, depends on Responder Service
4. **Dispatch & Tracking Service** — Depends on incidents being dispatched
5. **Analytics Service** — Consumes events from all other services

---

## Phase 3 — Frontend Pages

| Page                     | Actor          | Key Feature                                          |
| ------------------------ | -------------- | ---------------------------------------------------- |
| Login                    | All            | JWT login, role-based redirect                       |
| Dashboard                | System Admin   | Open incidents list, quick stats                     |
| New Incident Form        | System Admin   | Google Maps location picker, auto-dispatch on submit |
| Incident Detail          | System Admin   | Status tracker, assigned unit, live map              |
| Live Tracking Map        | System Admin   | Real-time vehicle position via WebSocket             |
| Hospital Dashboard       | Hospital Admin | Bed count, ambulance status                          |
| Police Station Dashboard | Police Admin   | Officer list, station status                         |
| Fire Station Dashboard   | Fire Admin     | Station status, personnel                            |
| Analytics                | All Admins     | Charts — response times, incidents by region         |

---

## Best Practices for This Project

### Security

- Hash passwords with `bcrypt` (salt rounds ≥ 12)
- Short-lived access tokens (15 min) + refresh tokens (7 days)
- Validate and sanitize all input with `express-validator`
- Never expose internal service ports — route everything through the API Gateway
- Store secrets in `.env` files, never commit them

### Microservice Communication

- Each service validates JWT independently using the shared JWT secret (via env var)
- Services communicate with each other using internal HTTP calls (axios) or RabbitMQ
- Use circuit breaker pattern (optional: `opossum` library) for inter-service HTTP calls

### Database

- Each service has its own MongoDB database — no shared databases
- Use Mongoose for schema validation and ODM
- Add `2dsphere` indexes on all location fields for geospatial queries
- Use MongoDB transactions where data consistency matters

### Code Structure (per service)

```
service-name/
├── src/
│   ├── config/         # DB connection, env vars
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, validation, error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── services/       # Business logic
│   ├── queues/         # RabbitMQ producers/consumers
│   └── app.js          # Express app setup
├── .env
├── Dockerfile
└── package.json
```

### Docker

- One `Dockerfile` per service
- One root `docker-compose.yml` to orchestrate all services + MongoDB instances + RabbitMQ
- Use named volumes for MongoDB data persistence

### API Design

- Version all APIs: `/api/v1/...`
- Use standard HTTP status codes consistently
- Return consistent error shape: `{ success: false, error: { code, message } }`
- Return consistent success shape: `{ success: true, data: {...} }`
- Document with Swagger (`swagger-jsdoc` + `swagger-ui-express`)

---

## Technology Stack Summary

| Layer                       | Technology                                      |
| --------------------------- | ----------------------------------------------- |
| Runtime                     | Node.js 20 LTS                                  |
| Framework                   | Express.js                                      |
| Database                    | MongoDB 7 (one instance per service)            |
| ODM                         | Mongoose                                        |
| Auth                        | JWT (`jsonwebtoken`), `bcrypt`                  |
| Message Queue               | RabbitMQ (`amqplib`)                            |
| Real-time                   | Socket.io                                       |
| Validation                  | `express-validator`                             |
| API Docs                    | Swagger (`swagger-jsdoc`, `swagger-ui-express`) |
| Frontend                    | React 18 + Vite                                 |
| Maps                        | Google Maps JavaScript API                      |
| Charts                      | Recharts or Chart.js                            |
| Containerization            | Docker + Docker Compose                         |
| API Gateway                 | nginx                                           |
| HTTP Client (inter-service) | axios                                           |
