# Microservice Architecture Diagram & Overview

## System Architecture

```
╔══════════════════════════════════════════════════════════════════════╗
║                     REACT FRONTEND (Port 5173)                      ║
║                                                                      ║
║  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ ║
║  │  Login /    │  │  Incident    │  │  Live Map    │  │Analytics │ ║
║  │  Dashboard  │  │  Form        │  │  (WebSocket) │  │Dashboard │ ║
║  └─────────────┘  └──────────────┘  └──────────────┘  └──────────┘ ║
╚════════════════════════════╤═════════════════════════════════════════╝
                             │  HTTPS / WSS
                             ▼
╔══════════════════════════════════════════════════════════════════════╗
║              API GATEWAY — nginx reverse proxy (Port 80)            ║
║                                                                      ║
║  • Routes /api/v1/auth/*          → Auth Service :3001              ║
║  • Routes /api/v1/incidents/*     → Emergency Incident Service :3002 ║
║  • Routes /api/v1/hospitals/*     → Emergency Incident Service :3002 ║
║  • Routes /api/v1/ambulances/*    → Emergency Incident Service :3002 ║
║  • Routes /api/v1/police-*        → Emergency Incident Service :3002 ║
║  • Routes /api/v1/fire-*          → Emergency Incident Service :3002 ║
║  • Routes /api/v1/responders/*    → Emergency Incident Service :3002 ║
║  • Routes /api/v1/vehicles/*      → Tracking Service :3003          ║
║  • Routes /api/v1/dispatches/*    → Tracking Service :3003          ║
║  • Routes /socket.io/*            → Tracking Service :3003 (WS)     ║
║  • Routes /api/v1/analytics/*     → Analytics Service :3004         ║
╚═══════╤══════════════════════════════╤══════════╤════════════════════╝
        │                              │          │
        ▼                              ▼          ▼
 ┌─────────────┐  ┌────────────────────────┐  ┌──────────────┐
 │    AUTH     │  │  EMERGENCY INCIDENT    │  │  ANALYTICS   │
 │   SERVICE   │  │       SERVICE          │  │   SERVICE    │
 │  Port 3001  │  │       Port 3002        │  │  Port 3004   │
 │             │  │                        │  │              │
 │  - Users    │  │  - Incidents           │  │  - Snapshots │
 │  - JWT      │  │  - Hospitals           │  │  - Summaries │
 │  - Roles    │  │  - Ambulances          │  └──────┬───────┘
 └──────┬──────┘  │  - Police Stations     │         │
        │         │  - Fire Stations       │    ┌────▼──────┐
   ┌────▼───┐     │  - Nearest Responder   │    │analytics_ │
   │auth_db │     │    (geospatial query)  │    │db MongoDB │
   │MongoDB │     └───────────┬────────────┘    └───────────┘
   └────────┘                 │
                        ┌─────▼──────┐
                        │incident_db │
                        │  MongoDB   │
                        └────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║           DISPATCH & TRACKING SERVICE  (Port 3003)                  ║
║                                                                      ║
║  • HTTP: Receives GPS pings from driver mobile app                  ║
║  • WebSocket (Socket.io): Pushes live location to admin dashboard   ║
║  • Publishes vehicle events to RabbitMQ                             ║
╚══════════════════════════╤═══════════════════════════════════════════╝
                           │
                      ┌────▼─────┐
                      │tracking_ │
                      │db MongoDB│
                      └──────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                    RABBITMQ BROKER  (Port 5672)                     ║
║                                                                      ║
║  Exchange: incident.events (topic)                                  ║
║    incident.created     → Analytics                                 ║
║    incident.dispatched  → Analytics, Tracking                       ║
║    incident.resolved    → Analytics                                 ║
║    incident.status_changed → Analytics                              ║
║                                                                      ║
║  Exchange: tracking.events (topic)                                  ║
║    vehicle.location_updated → Analytics                             ║
║    vehicle.arrived          → Emergency Incident Service            ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Service Responsibilities Summary

| # | Service | Port | Owns | Key Responsibilities |
|---|---------|------|------|---------------------|
| 1 | **Auth Service** | 3001 | Users, refresh tokens | Registration, login, JWT issuance, role enforcement |
| 2 | **Emergency Incident Service** | 3002 | Incidents, hospitals, ambulances, police stations, fire stations, officers, personnel | Incident creation, nearest-responder geospatial selection, responder CRUD, incident status lifecycle, event publishing |
| 3 | **Dispatch & Tracking Service** | 3003 | Dispatch records, vehicle location history, live positions | Accept GPS pings, maintain live positions, broadcast via WebSocket, detect arrival, publish vehicle events |
| 4 | **Analytics & Monitoring Service** | 3004 | Incident snapshots, response time summaries, capacity logs | Consume events, aggregate response times, resource utilization, incident stats by region/type |

> **Note:** Responder Management was merged into the Emergency Incident Service. Incident creation and nearest-responder selection are tightly coupled — the service queries its own local models instead of making an HTTP call to a separate service. This reduces latency and eliminates an unnecessary network dependency.

---

## Inter-Service Communication Map

```
                        ┌─────────────┐
                        │    Auth     │
                        │   Service   │
                        │             │
                        │  All services validate JWT
                        │  using shared secret (env var)
                        └─────────────┘

┌──────────────────────────────────────┐
│     Emergency Incident Service       │
│                                      │
│  Incident created                    │
│    → queries local Ambulance /        │
│      PoliceStation / FireStation     │
│      model directly ($near query)    │
│    → no HTTP call needed             │
│                                      │
│  publishes ──────────────────────────┼──────────────────────┐
│    incident.created                  │                      │
│    incident.dispatched               │                      ▼
│    incident.resolved                 │         ┌─────────────────────┐
│    incident.status_changed           │         │      RabbitMQ       │
│                                      │         └──────────┬──────────┘
│  ◀── vehicle.arrived ────────────────┼───────────────────┐│
│       (auto-updates to in_progress)  │                   ││
└──────────────────────────────────────┘         ┌─────────▼▼──────────┐
                                                  │   Analytics Service  │
┌──────────────────────┐                          │   (subscribes to     │
│  Tracking Service    │ ── vehicle.location ──▶  │    all events)       │
│                      │    vehicle.arrived        └──────────────────────┘
└──────────────────────┘
```

---

## Docker Compose Service Map

```yaml
services:
  rabbitmq:          # Message broker — Ports 5672 + 15672

  # Microservice 1 — Identity & Authentication
  auth-db:           # MongoDB for auth_db
  auth-service:      # Port 3001

  # Microservice 2 — Emergency Incident (includes responder management)
  incident-db:       # MongoDB for incident_db
  incident-service:  # Port 3002

  # Microservice 3 — Dispatch & Tracking
  tracking-db:       # MongoDB for tracking_db
  tracking-service:  # Port 3003

  # Microservice 4 — Analytics & Monitoring
  analytics-db:      # MongoDB for analytics_db
  analytics-service: # Port 3004

  # Frontend (optional in docker-compose for dev)
  frontend:          # Port 5173 (Vite dev server)
```

---

## Technology Decisions Rationale

### Why MongoDB for all services?
- Native GeoJSON + `2dsphere` index for geospatial nearest-responder queries — no extension needed
- Flexible schema suits incidents (notes, varying fields per type) and analytics (varying metrics)
- All services can use the same DB engine, simpler for a course project
- Each service still has its own database — the microservice database isolation principle is maintained

### Why merge Responder Management into Emergency Incident Service?
- Nearest-responder selection is a core part of incident creation — they are logically coupled
- Eliminates a synchronous HTTP call between services on the critical path (incident creation)
- Reduces infrastructure complexity: one fewer service, one fewer database
- Aligns with the course requirement of 4 microservices

### Why RabbitMQ over direct HTTP for events?
- Analytics Service would need to be called from multiple services without a message queue — tight coupling
- If Analytics is down, incidents shouldn't fail
- Events are naturally fire-and-forget (incident.resolved → compute analytics asynchronously)
- RabbitMQ has persistence: events aren't lost if Analytics restarts

### Why Socket.io for tracking?
- Real-time bidirectional: drivers push location, admin dashboard receives instantly
- Room support: admins can subscribe to specific incidents only
- Automatic fallback to long-polling if WebSocket isn't available
- Native Node.js support, well-documented

### Why nginx as API Gateway?
- Single entry point for the frontend — no CORS issues
- Handles TLS termination in production
- Lightweight, widely deployed, easy to configure
- Simpler than building a custom Express gateway for a course project
