# Skills & Competencies Demonstrated
## Emergency Response & Dispatch Platform — Ghana

This document catalogs the technical skills, architectural patterns, and engineering practices applied throughout this project.

---

## 1. Software Architecture

### Microservices Design
- Decomposed a monolithic problem domain into 4 independently deployable services, each with a single responsibility (auth, incident management, vehicle tracking, analytics)
- Designed explicit service boundaries — no shared databases, no shared code across service boundaries
- Applied the **strangler pattern** mentally: each service can be replaced or scaled independently without affecting others

### Event-Driven Architecture
- Designed an **async messaging backbone** using RabbitMQ topic exchanges
- Defined event contracts (`incident.created`, `incident.dispatched`, `vehicle.location_updated`, `vehicle.arrived`, etc.) so services are **temporally decoupled** — they don't need to be up at the same moment to communicate
- Used the **publish/subscribe** pattern: multiple consumers can react to the same event (e.g., both Tracking and Analytics consume `incident.dispatched`)

### API Gateway Pattern
- Used nginx as a single entry point: routes all `/api/v1/*` paths to the correct upstream service
- Centralised CORS, header forwarding, and WebSocket upgrade handling in one place rather than duplicating across services

### Domain-Driven Design (DDD) Influences
- Modelled the system around bounded contexts: Auth, Incident Management, Tracking, Analytics
- Each context owns its own data store and exposes only what other contexts need via API or events

---

## 2. Backend Engineering (Node.js / Express)

### RESTful API Design
- Designed and implemented RESTful endpoints across 4 services following HTTP verb semantics (GET, POST, PUT, DELETE)
- Used consistent response shapes, HTTP status codes, and error envelopes across all services
- Implemented request validation with `express-validator` (schema-level input sanitisation before hitting controllers)

### Authentication & Authorisation
- Implemented **JWT-based auth** with short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
- Stored refresh tokens in MongoDB with a TTL index for automatic expiry — no manual cleanup required
- Hashed passwords with **bcrypt** (cost factor designed for production use)
- Built **role-based access control (RBAC)** middleware: roles (`system_admin`, `hospital_admin`, `ambulance_driver`, `police_admin`, `fire_admin`, `dispatcher`) gate specific routes
- Implemented a **JWT secret shared across services** (environment variable) so any service can verify tokens independently without calling Auth Service

### Middleware Architecture
- Layered Express middleware: CORS → rate limiting → body parsing → request validation → JWT verification → route handler → error handler
- Centralised error handling middleware catches unhandled exceptions and returns consistent error responses

### Rate Limiting
- Applied `express-rate-limit` specifically on authentication endpoints (login, register) to mitigate brute-force attacks

### RabbitMQ / AMQP Integration
- Used `amqplib` to connect to RabbitMQ broker, declare topic exchanges, bind queues with routing keys, and publish/consume messages
- Implemented **graceful startup**: services wait for RabbitMQ to be ready before declaring topology
- Consumers acknowledge messages only after successful processing (prevents data loss on crashes)

### WebSocket / Real-time
- Integrated **Socket.io** into the Tracking Service alongside Express on the same HTTP server
- Implemented room-based subscriptions: clients subscribe to `all` vehicles or specific incident channels
- Server broadcasts `vehicle:location` events on every GPS ping, enabling live map updates with sub-second latency

---

## 3. Database Engineering (MongoDB / Mongoose)

### Geospatial Queries
- Used MongoDB **2dsphere indexes** on location fields across multiple collections (hospitals, ambulances, police stations, fire stations, incidents)
- Implemented **`$near` geospatial operator** to find the nearest available responder to an incident location — the core dispatch algorithm
- Stored all coordinates as **GeoJSON Points** in `[longitude, latitude]` order (consistent with GeoJSON spec)

### Schema Design
- Designed Mongoose schemas with appropriate field types, required constraints, enums, and default values
- Used **TTL indexes** on refresh tokens for automatic expiration without a cleanup cron job
- Applied **compound indexes** where queries filter on multiple fields (e.g., status + organisationId)
- Maintained **separate databases per service** (no cross-service joins) — data is denormalised or duplicated intentionally for the Analytics service to avoid cross-service queries

### Aggregation Patterns
- Pre-aggregated analytics data in the Analytics Service (response time summaries by period, region, type) so dashboard queries are O(1) lookups rather than expensive real-time aggregations

---

## 4. Frontend Engineering (React)

### Component Architecture
- Built a component hierarchy: Layout (Navbar + Sidebar + Outlet) → Pages → Feature Components → UI Primitives
- Separated concerns: pages own data-fetching and state; UI components are stateless and reusable

### State Management
- Used **React Context API** for global state (auth session, Socket.io connection) — appropriately scoped, no Redux needed at this scale
- Local component state (`useState`, `useEffect`) for page-level data fetching and UI state

### React Router v6
- Implemented nested routing with `<Outlet>` for the authenticated layout wrapper
- Role-based route protection: `<Navigate>` redirects unauthenticated users to login, post-login redirects back to intended route

### Real-time Frontend
- Connected to Socket.io from `SocketContext`, exposing `on` and `emit` helpers to all child components
- `LiveMap.jsx` subscribes to `vehicle:location` events and updates Leaflet markers in real time without page refresh

### Axios Interceptors
- Request interceptor auto-attaches Bearer JWT token to every request
- Response interceptor catches 401 errors, silently requests a new access token via the refresh endpoint, retries the original request — transparent to the user

### Leaflet / react-leaflet
- Integrated Leaflet for interactive mapping with OpenStreetMap tiles (no API key required)
- Built custom `divIcon` markers using inline SVG with:
  - Radial gradients for roof depth/dome effect
  - Per-instance unique gradient IDs to avoid SVG DOM collisions across multiple markers
  - Heading rotation (`transform: rotate(Xdeg)`) for directional vehicle icons
  - Pulsing CSS animation ring when vehicle is moving
- Implemented an `IncidentMapPicker` component: click on map to select incident location, returns GeoJSON Point

### Recharts
- Used Recharts to render response time trends, incident volume charts, and regional breakdowns in the Analytics dashboard

---

## 5. DevOps & Infrastructure

### Docker & Docker Compose
- Wrote `Dockerfile` for each service using the **multi-stage** pattern (or lean base images)
- Orchestrated the full system (4 services + 4 MongoDB instances + RabbitMQ + nginx) in a single `docker-compose.yml`
- Used Docker health checks so dependent services wait for their dependencies to be healthy before starting
- Used named Docker volumes for MongoDB data persistence across container restarts

### nginx as Reverse Proxy / API Gateway
- Configured nginx with upstream blocks, `proxy_pass` routing, and `proxy_set_header` for forwarding real client IPs
- Added WebSocket upgrade headers (`Upgrade`, `Connection`) for Socket.io proxying
- Used `nginx.conf.template` with environment variable substitution for flexible deployment

### Environment Configuration
- Used `.env` files (with `.env.example` committed) for per-service configuration
- Parameterised all secrets (JWT secret, MongoDB URIs, RabbitMQ URL) via environment variables — no hardcoded credentials

### Deployment Guides
- Wrote platform-specific deployment guides for **Railway** and **Render**
- Production checklist covering: JWT secret rotation, MongoDB Atlas IP whitelisting, HTTPS with Certbot, RabbitMQ credential hardening

---

## 6. API Documentation

### Swagger / OpenAPI
- Annotated all Express routes with JSDoc-style Swagger comments
- Each service exposes a self-hosted Swagger UI at `/api-docs`
- Documents request bodies, query parameters, response schemas, and authentication requirements

---

## 7. Security Practices

| Practice | Implementation |
|---|---|
| Password hashing | bcrypt with appropriate cost factor |
| Short-lived tokens | JWT access tokens expire in 15 minutes |
| Refresh token rotation | Stored in DB with TTL; invalidated on logout |
| Input validation | express-validator on all mutating endpoints |
| Rate limiting | On login/register to mitigate brute-force |
| CORS | Configured per-service and enforced at gateway |
| No hardcoded secrets | All via environment variables |
| Role-based access | Middleware gates routes by user role |

---

## 8. System Design Concepts Applied

| Concept | Where Applied |
|---|---|
| **Separation of concerns** | Each microservice owns one domain |
| **Single responsibility** | Each module (route/controller/model/service) has one job |
| **DRY (Don't Repeat Yourself)** | Shared JWT middleware, shared error handler per service |
| **Fail fast** | Input validation runs before business logic |
| **Eventual consistency** | Analytics data is updated asynchronously via RabbitMQ, not immediately |
| **Idempotency** | `live_positions` uses MongoDB `upsert` — same vehicle pinging twice produces one record |
| **Graceful degradation** | Frontend shows cached/last-known data if WebSocket drops |
| **Observability** | Health check endpoints (`/health`) on every service for load balancer / Docker health checks |

---

## 9. Soft Skills & Process

- **Phase-gated planning**: Completed full design documentation (Phase 1) before any implementation, covering architecture, database schemas, API contracts, and message queue topology
- **Incremental delivery**: Built in logical order — Auth → Incident → Tracking → Analytics (each layer depends on the previous)
- **Documentation-first**: API contracts written in design docs before implementation; Swagger auto-generated from code comments
- **Seed scripts**: Wrote a data seeder to enable rapid demo setup without manual data entry

---

## Technology Index

| Technology | Category | Proficiency Demonstrated |
|---|---|---|
| React 18 | Frontend framework | Component architecture, hooks, context, routing |
| Vite | Build tooling | Dev server config, proxy setup, build pipeline |
| Tailwind CSS | Styling | Utility-first design, responsive layout |
| Leaflet / react-leaflet | Mapping | Custom markers, SVG icons, geospatial interaction |
| Recharts | Data visualisation | Line/bar/area charts for analytics |
| Socket.io (client) | Real-time | Event subscription, room management |
| Axios | HTTP client | Interceptors, token refresh, API abstraction |
| React Router v6 | Routing | Nested routes, protected routes, layout patterns |
| Node.js 20 | Runtime | Async/await, event loop, stream handling |
| Express.js | HTTP framework | Middleware, routing, error handling |
| MongoDB 7 | Database | Geospatial indexes, TTL indexes, aggregation |
| Mongoose 8 | ODM | Schema design, virtuals, populate, index options |
| RabbitMQ 3.12 | Message broker | Topic exchanges, queue binding, pub/sub |
| amqplib | AMQP client | Producer/consumer patterns, acknowledgements |
| Socket.io (server) | WebSocket server | Rooms, broadcasting, event emission |
| JWT | Authentication | Token generation, verification, refresh pattern |
| bcrypt | Cryptography | Password hashing, salt rounds |
| Docker | Containerisation | Dockerfile, multi-service orchestration |
| Docker Compose | Orchestration | Service dependencies, health checks, volumes |
| nginx | Reverse proxy | Upstream routing, WebSocket proxying, CORS |
| Swagger / OpenAPI | API documentation | JSDoc annotations, Swagger UI |
