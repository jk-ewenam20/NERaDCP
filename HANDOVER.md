# Project Handover Document
## Emergency Response & Dispatch Platform — Ghana (GH-ERS)

**Project type:** University course project — Mobile & Web Software Design & Architecture
**Stack:** MERN (MongoDB, Express, React, Node.js) + RabbitMQ + Socket.io
**Phase:** Phase 2 complete (backend + frontend built and running)
**Last updated:** March 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Architecture Overview](#3-architecture-overview)
4. [Services Reference](#4-services-reference)
5. [Getting Started — Local Development](#5-getting-started--local-development)
6. [Environment Variables](#6-environment-variables)
7. [User Roles & Access](#7-user-roles--access)
8. [Key Flows & How Things Work](#8-key-flows--how-things-work)
9. [Frontend Guide](#9-frontend-guide)
10. [API Quick Reference](#10-api-quick-reference)
11. [Database Models](#11-database-models)
12. [Message Queue Events](#12-message-queue-events)
13. [Known Issues & Gaps](#13-known-issues--gaps)
14. [Deployment](#14-deployment)
15. [Design Documentation](#15-design-documentation)

---

## 1. Project Overview

GH-ERS is a distributed emergency response and dispatch coordination system designed for Ghana. It coordinates hospitals, ambulances, police stations, and fire stations to respond to emergencies efficiently.

### What it does
- Operators log incidents (medical, fire, crime, accident) with a map location picker
- The system automatically finds the nearest available responder using geospatial queries and dispatches them
- Dispatched vehicles broadcast their GPS location in real time — visible on a live map
- Analytics track response times, incident volumes, and responder availability over time

### What it does NOT do (out of scope)
- Mobile app for drivers (drivers use the web app or raw API)
- SMS/push notifications
- Payment/billing
- Public-facing citizen portal

---

## 2. Repository Structure

```
course-project/
├── auth-service/           # JWT auth, user management (Port 3001)
├── incident-service/       # Incidents, resources, auto-dispatch (Port 3002)
├── tracking-service/       # GPS pings, Socket.io live map (Port 3003)
├── analytics-service/      # RabbitMQ consumer, stats API (Port 3004)
├── gateway/                # nginx reverse proxy config
├── frontend/               # React 18 + Vite web app (Port 5173 dev)
├── phase-1-design/         # Architecture, DB, API, queue design docs
├── docker-compose.yml      # Full stack orchestration
├── PROJECT_PLAN.md         # Master plan + build order rationale
├── README.md               # Setup instructions (start here for running)
├── HANDOVER.md             # This file
├── SKILLS.md               # Skills & patterns demonstrated
├── RENDER_DEPLOYMENT.md    # Render.com deployment guide
└── RAILWAY_DEPLOYMENT.md   # Railway.app deployment guide
```

Each backend service follows this internal structure:

```
<service>/
├── src/
│   ├── app.js              # Express setup, middleware, routes
│   ├── routes/             # Route definitions
│   ├── controllers/        # Request handlers
│   ├── models/             # Mongoose schemas
│   ├── services/           # Business logic
│   ├── middleware/         # JWT auth, validation
│   └── consumers/          # RabbitMQ event consumers
├── package.json
├── .env                    # Local secrets (git-ignored)
└── .env.example            # Template (committed)
```

---

## 3. Architecture Overview

```
                         ┌──────────────┐
                         │   Browser    │
                         │  (React app) │
                         └──────┬───────┘
                                │ HTTP / WebSocket
                                ▼
                         ┌──────────────┐
                         │    nginx     │  ← API Gateway (port 80/443)
                         │  (gateway/)  │
                         └──────┬───────┘
               ┌────────────────┼────────────────┬──────────────────┐
               ▼                ▼                ▼                  ▼
        ┌────────────┐  ┌──────────────┐  ┌───────────────┐  ┌────────────┐
        │    Auth    │  │   Incident   │  │   Tracking    │  │ Analytics  │
        │  :3001     │  │   :3002      │  │   :3003       │  │  :3004     │
        └─────┬──────┘  └──────┬───────┘  └───────┬───────┘  └─────┬──────┘
              │                │                   │                │
              ▼                ▼                   ▼                ▼
          auth_db         incident_db          tracking_db      analytics_db
         (MongoDB)        (MongoDB)            (MongoDB)        (MongoDB)

                    Incident ──publish──▶ RabbitMQ ◀──consume── Analytics
                    Tracking ──publish──▶ RabbitMQ ◀──consume── Incident
                                                  ◀──consume── Analytics
```

### Communication rules
| From → To | Method | When |
|---|---|---|
| Frontend → any service | HTTP REST (via nginx) | All data operations |
| Frontend ↔ Tracking | WebSocket (Socket.io) | Live vehicle locations |
| Incident → Tracking | RabbitMQ async event | `incident.dispatched` triggers dispatch record creation |
| Tracking → Incident | RabbitMQ async event | `vehicle.arrived` triggers incident status → `in_progress` |
| Incident → Analytics | RabbitMQ async event | All incident lifecycle events |
| Tracking → Analytics | RabbitMQ async event | `vehicle.location_updated` |
| Incident → Tracking | HTTP (sync) | `GET /responders/nearest` during dispatch |

---

## 4. Services Reference

### Auth Service — Port 3001
**Responsibility:** Issue and validate JWTs. Manage users and roles.

| File | Purpose |
|---|---|
| `src/app.js` | Express setup, rate limiting (20 req/15min on login/register), Swagger |
| `src/models/user.model.js` | User schema: name, email, passwordHash, role, stationId, orgId, isActive |
| `src/models/refreshToken.model.js` | Refresh token with TTL auto-expiry |
| `src/controllers/auth.controller.js` | Login, register, refresh, logout, profile, user list |

**Critical note:** The `JWT_SECRET` env var must be **identical** across all four services. Every service verifies tokens locally without calling Auth Service.

---

### Incident Service — Port 3002
**Responsibility:** Incident lifecycle (create → dispatch → in_progress → resolved). Manages all resource collections (hospitals, ambulances, police/fire stations). Contains the nearest-responder dispatch logic.

| File | Purpose |
|---|---|
| `src/services/` | Core business logic — nearest responder query, incident state machine |
| `src/models/incident.model.js` | Incident schema with 2dsphere index on `location` |
| `src/models/ambulance.model.js` | Ambulance with `location` (2dsphere), `hospitalId`, `driverId`, `status` |
| `src/routes/responder.routes.js` | `GET /api/v1/responders/nearest` — geospatial $near query |
| `src/consumers/` | Consumes `vehicle.arrived` → sets incident to `in_progress` |
| `src/scripts/seed.js` | Seed script for demo data |

**Dispatch logic:** On `POST /api/v1/incidents`, the service calls `$near` on the `ambulances` collection (2dsphere index) to find the closest available unit, assigns it, and publishes `incident.dispatched` to RabbitMQ.

---

### Tracking Service — Port 3003
**Responsibility:** Receive GPS pings from vehicles, broadcast locations via Socket.io, maintain live position state, detect vehicle arrival at scene.

| File | Purpose |
|---|---|
| `src/app.js` | Creates HTTP server, attaches Socket.io to same server |
| `src/models/livePosition.model.js` | One document per vehicle, **upserted** on every ping |
| `src/models/dispatchRecord.model.js` | Created when `incident.dispatched` is consumed |
| `src/routes/vehicle.routes.js` | `POST /api/v1/vehicles/ping` — driver sends GPS coords |
| `src/consumers/` | Consumes `incident.dispatched` → creates dispatch record |

**Socket.io events:**
| Event | Direction | Payload |
|---|---|---|
| `subscribe:all` | Client → Server | — |
| `subscribe:incident` | Client → Server | `{ incidentId }` |
| `unsubscribe:incident` | Client → Server | `{ incidentId }` |
| `vehicle:location` | Server → Client | `{ vehicleId, location, speed, heading, incidentId, lastUpdated }` |
| `vehicle:arrived` | Server → Client | `{ vehicleId, incidentId }` |

---

### Analytics Service — Port 3004
**Responsibility:** Consume all lifecycle events from RabbitMQ and materialise pre-aggregated stats that the frontend dashboard queries.

| File | Purpose |
|---|---|
| `src/consumers/incident.consumer.js` | Subscribes to all `incident.*` events |
| `src/consumers/vehicle.consumer.js` | Subscribes to `vehicle.location_updated` |
| `src/models/incidentSnapshot.model.js` | Denormalised incident data for fast queries |
| `src/models/responseTimeSummary.model.js` | Pre-aggregated by period/region/type |
| `src/controllers/analytics.controller.js` | Serves summary, incident, and responder stats |

**Note:** Analytics data is **eventually consistent** — it reflects what has been consumed from RabbitMQ, not the live state of the Incident Service database.

---

## 5. Getting Started — Local Development

### Prerequisites
- Docker Desktop (recommended) — or Node.js 20 + MongoDB + RabbitMQ installed locally
- Git

### Option A — Docker Compose (recommended)

```bash
# 1. Clone the repo and enter the project
cd course-project

# 2. Create .env files from examples
cp auth-service/.env.example      auth-service/.env
cp incident-service/.env.example  incident-service/.env
cp tracking-service/.env.example  tracking-service/.env
cp analytics-service/.env.example analytics-service/.env

# 3. Start all backend services + databases + RabbitMQ
docker compose up --build

# 4. In a separate terminal, start the frontend
cd frontend
npm install
npm run dev
```

Access points:
| URL | What |
|---|---|
| `http://localhost:5173` | Frontend (React app) |
| `http://localhost:3001/api-docs` | Auth Service — Swagger UI |
| `http://localhost:3002/api-docs` | Incident Service — Swagger UI |
| `http://localhost:3003/api-docs` | Tracking Service — Swagger UI |
| `http://localhost:3004/api-docs` | Analytics Service — Swagger UI |
| `http://localhost:15672` | RabbitMQ Management UI (guest / guest) |

### Seeding Demo Data

```bash
docker compose exec incident-service node src/scripts/seed.js
```

This creates sample hospitals, ambulances, police/fire stations, users (including a `system_admin`), and a few demo incidents in Accra.

### Option B — Manual (no Docker)

Requires MongoDB and RabbitMQ running on `localhost` with default ports.

```bash
# Each service in its own terminal
cd auth-service      && npm install && npm run dev
cd incident-service  && npm install && npm run dev
cd tracking-service  && npm install && npm run dev
cd analytics-service && npm install && npm run dev
cd frontend          && npm install && npm run dev
```

Update each `.env` to point `MONGODB_URI` and `RABBITMQ_URL` to `localhost` instead of the Docker service names.

---

## 6. Environment Variables

All values below are for **local development only**. Change secrets for any production deployment.

### Auth Service (`auth-service/.env`)
```
PORT=3001
MONGODB_URI=mongodb://auth-db:27017/auth_db
JWT_SECRET=emergencyResponseJwtSecret2025
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

### Incident Service (`incident-service/.env`)
```
PORT=3002
MONGODB_URI=mongodb://incident-db:27017/incident_db
JWT_SECRET=emergencyResponseJwtSecret2025
RABBITMQ_URL=amqp://rabbitmq
NODE_ENV=development
```

### Tracking Service (`tracking-service/.env`)
```
PORT=3003
MONGODB_URI=mongodb://tracking-db:27017/tracking_db
JWT_SECRET=emergencyResponseJwtSecret2025
RABBITMQ_URL=amqp://rabbitmq
NODE_ENV=development
```

### Analytics Service (`analytics-service/.env`)
```
PORT=3004
MONGODB_URI=mongodb://analytics-db:27017/analytics_db
JWT_SECRET=emergencyResponseJwtSecret2025
RABBITMQ_URL=amqp://rabbitmq
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
# Leave blank for local dev (Vite proxy handles routing)
VITE_API_BASE_URL=
VITE_TRACKING_URL=
```

> **Production rule:** `JWT_SECRET` must be a random string of at least 64 characters and must be the same value in all four backend services.

---

## 7. User Roles & Access

| Role | Description | Access |
|---|---|---|
| `system_admin` | Full system administrator | All pages, all CRUD, user management |
| `hospital_admin` | Manages a specific hospital | Hospital resources, bed capacity, own ambulances |
| `ambulance_driver` | Field responder | View assigned incidents, send GPS pings |
| `police_admin` | Manages a police station | Police station resources |
| `fire_admin` | Manages a fire station | Fire station resources |
| `dispatcher` | Creates and monitors incidents | Create incidents, view all, no resource management |

### How roles are enforced
- The JWT payload contains `{ userId, role, stationId, organizationId, organizationType }`
- Backend middleware checks `req.user.role` against a whitelist before processing the request
- Frontend hides navigation items and page sections based on the role stored in `AuthContext`

---

## 8. Key Flows & How Things Work

### 8.1 Login
1. User submits email + password
2. Auth Service validates credentials, issues access token (15 min) + refresh token (7 days)
3. Frontend stores tokens (localStorage or memory — check `AuthContext.jsx`)
4. Axios request interceptor attaches `Authorization: Bearer <token>` to every subsequent request
5. On 401 response, Axios response interceptor silently calls `POST /api/v1/auth/refresh-token` and retries

### 8.2 Creating an Incident & Auto-Dispatch
1. Operator fills the New Incident form, picks a location on the Leaflet map
2. `POST /api/v1/incidents` with `{ type, location: { type: "Point", coordinates: [lng, lat] }, citizenName, address, ... }`
3. Incident Service saves the incident (status: `created`)
4. Incident Service calls `GET /api/v1/responders/nearest?lng=X&lat=Y&type=ambulance` — MongoDB `$near` returns closest available ambulance
5. Incident Service assigns that ambulance, sets status → `dispatched`, publishes `incident.dispatched` to RabbitMQ
6. Tracking Service (consuming) creates a `dispatchRecord`
7. Analytics Service (consuming) logs the dispatch event
8. Frontend receives the 201 response and routes to the incident detail view

### 8.3 Live Vehicle Tracking
1. Ambulance driver (or the GPS Simulator panel in the UI, for demo) calls `POST /api/v1/vehicles/ping` with `{ vehicleId, location: [lng, lat], speed, heading, incidentId }`
2. Tracking Service upserts `livePositions` (one document per vehicle, keeps only the latest)
3. Tracking Service emits `vehicle:location` via Socket.io to all subscribed clients
4. `LiveMap.jsx` receives the event and updates the Leaflet marker position and rotation in real time
5. If the vehicle is within the arrival threshold of the incident location, Tracking Service emits `vehicle:arrived`, publishes it to RabbitMQ
6. Incident Service (consuming) sets incident status → `in_progress`

### 8.4 Analytics
- Analytics Service listens passively to all RabbitMQ events
- On `incident.resolved` it computes `responseTime = resolvedAt - createdAt`, stores the snapshot
- The Analytics page queries `GET /api/v1/analytics/summary` which reads from pre-aggregated collections — fast O(1) reads

---

## 9. Frontend Guide

### Pages

| Route | Component | Access |
|---|---|---|
| `/login` | `Login.jsx` | Public |
| `/` | `Dashboard.jsx` | All authenticated |
| `/incidents` | `Incidents.jsx` | All authenticated |
| `/incidents/new` | `NewIncident.jsx` | system_admin, dispatcher |
| `/live-map` | `LiveMap.jsx` | All authenticated |
| `/analytics` | `Analytics.jsx` | All authenticated |
| `/resources` | `Resources.jsx` | system_admin, hospital_admin, police_admin, fire_admin |
| `/users` | `Users.jsx` | system_admin only |
| `/profile` | `Profile.jsx` | All authenticated |

### Key Component Files

| File | What it does |
|---|---|
| `src/App.jsx` | Defines all routes, wraps with `AuthProvider` and `SocketProvider` |
| `src/contexts/AuthContext.jsx` | Stores logged-in user, exposes `login()`, `logout()`, `user`, `loading` |
| `src/contexts/SocketContext.jsx` | Manages Socket.io connection, exposes `socket`, `on()`, `emit()` |
| `src/api/axios.js` | Base Axios instance with JWT interceptor and token refresh logic |
| `src/components/Map/LiveTrackingMap.jsx` | Leaflet map + custom SVG vehicle markers + incident pins |
| `src/components/Map/IncidentMapPicker.jsx` | Click-to-set-location map for the New Incident form |

### Adding a New Page
1. Create `src/pages/MyPage.jsx`
2. Add a route in `src/App.jsx`: `<Route path="/my-page" element={<MyPage />} />`
3. Add a nav link in `src/components/Layout/Sidebar.jsx`
4. If role-restricted, add a role check in the route or inside the component

### Adding a New API Call
1. Find the relevant file in `src/api/` (or create a new one)
2. Export an async function that calls `axiosInstance.get/post/put/delete(...)`
3. Import and use it in your component with `useEffect` + `useState`

---

## 10. API Quick Reference

All routes are prefixed with `/api/v1/`. All endpoints except login/register require `Authorization: Bearer <token>`.

### Auth Service (:3001)
```
POST   /auth/register          Create user account
POST   /auth/login             Returns { accessToken, refreshToken, user }
POST   /auth/refresh-token     Returns new accessToken
POST   /auth/logout            Revoke refresh token
GET    /auth/profile           Get current user
PUT    /auth/profile           Update name/email
GET    /auth/users             List all users (system_admin)
PUT    /auth/users/:id/status  Activate/deactivate user
```

### Incident Service (:3002)
```
POST   /incidents                   Create incident (triggers auto-dispatch)
GET    /incidents                   List incidents (filtered by role/org)
GET    /incidents/open              Open incidents only
GET    /incidents/:id               Single incident
PUT    /incidents/:id/status        Update status
GET    /incidents/stats             Count by status

GET    /hospitals                   List hospitals
POST   /hospitals                   Create hospital
PUT    /hospitals/:id               Update hospital
PUT    /hospitals/:id/capacity      Update bed counts

GET    /ambulances                  List ambulances
POST   /ambulances                  Create ambulance
PUT    /ambulances/:id/status       Update availability
PUT    /ambulances/:id/driver       Assign driver

GET    /police-stations             List police stations
POST   /police-stations             Create station

GET    /fire-stations               List fire stations
POST   /fire-stations               Create station

GET    /responders/nearest          ?lng=X&lat=Y&type=ambulance|police|fire
```

### Tracking Service (:3003)
```
POST   /vehicles/ping               GPS ping { vehicleId, location, speed, heading, incidentId }
GET    /vehicles/active             Currently active vehicle positions

POST   /dispatches                  Create dispatch record
GET    /dispatches                  List dispatches
PUT    /dispatches/:id/status       Update dispatch status
```

### Analytics Service (:3004)
```
GET    /analytics/summary           High-level stats (total incidents, avg response time)
GET    /analytics/incidents         Incident breakdown by type/status/period
GET    /analytics/responders        Responder activity stats
```

---

## 11. Database Models

### Critical GeoJSON note
All location fields are stored as:
```json
{ "type": "Point", "coordinates": [longitude, latitude] }
```
This is **longitude first**, which is GeoJSON standard but opposite to what most people expect. When displaying on Leaflet, convert: `[coords[1], coords[0]]` → `[lat, lng]`.

### auth_db
| Collection | Key Fields |
|---|---|
| `users` | `email` (unique), `passwordHash`, `role`, `stationId`, `organizationId`, `organizationType`, `isActive` |
| `refreshtokens` | `token` (unique), `userId`, `expiresAt` (TTL index) |

### incident_db
| Collection | Key Fields |
|---|---|
| `incidents` | `location` (2dsphere), `type`, `status`, `assignedUnit`, `statusHistory[]`, `citizenName`, `address` |
| `hospitals` | `location` (2dsphere), `name`, `totalBeds`, `availableBeds`, `status` |
| `ambulances` | `location` (2dsphere), `hospitalId`, `driverId`, `vehicleNumber`, `status` |
| `policestations` | `location` (2dsphere), `name`, `region`, `status` |
| `policeofficers` | `userId`, `stationId`, `badgeNumber`, `rank` |
| `firestations` | `location` (2dsphere), `name`, `region`, `status` |
| `firepersonnel` | `userId`, `stationId`, `badgeNumber`, `rank` |

### tracking_db
| Collection | Key Fields |
|---|---|
| `dispatchrecords` | `incidentId`, `vehicleId`, `driverId`, `status` (en_route, arrived, completed, cancelled) |
| `vehiclelocations` | `vehicleId`, `location` (2dsphere), `speed`, `heading`, `recordedAt` |
| `livepositions` | `vehicleId` (unique), `location` (2dsphere), `speed`, `heading`, `lastUpdated` — one doc per vehicle, upserted |

### analytics_db
| Collection | Key Fields |
|---|---|
| `incidentsnapshots` | Denormalised incident + dispatch + resolution data |
| `hospitalcapacitylogs` | `hospitalId`, `availableBeds`, `totalBeds`, `loggedAt` |
| `responsetimesummaries` | `period`, `region`, `incidentType`, `avgResponseTime`, `count` |

---

## 12. Message Queue Events

RabbitMQ broker: `amqp://rabbitmq:5672`
Management UI: `http://localhost:15672` (user: guest, pass: guest)

### Exchange: `incident.events` (topic)
| Routing Key | Published by | Consumed by |
|---|---|---|
| `incident.created` | Incident Service | Analytics |
| `incident.dispatched` | Incident Service | Tracking, Analytics |
| `incident.status_changed` | Incident Service | Analytics |
| `incident.resolved` | Incident Service | Analytics |

### Exchange: `tracking.events` (topic)
| Routing Key | Published by | Consumed by |
|---|---|---|
| `vehicle.location_updated` | Tracking Service | Analytics |
| `vehicle.arrived` | Tracking Service | Incident Service, Analytics |

### Event payload shape (example: `incident.dispatched`)
```json
{
  "eventType": "incident.dispatched",
  "timestamp": "2026-03-26T10:30:00.000Z",
  "data": {
    "incidentId": "...",
    "type": "medical",
    "location": { "type": "Point", "coordinates": [-0.187, 5.603] },
    "assignedUnit": {
      "vehicleId": "...",
      "vehicleType": "ambulance",
      "driverId": "..."
    }
  }
}
```

---

## 13. Known Issues & Gaps

### What is complete
- All 4 backend services are functional and serving requests
- Full frontend with all 9 pages working
- Docker Compose orchestration
- JWT auth with refresh token rotation
- Role-based access control on frontend and backend
- RabbitMQ event publishing and consumption
- Socket.io live vehicle tracking
- Geospatial nearest-responder dispatch
- GPS Simulator panel (system_admin can simulate vehicle movement for demo)
- Swagger API docs on all services
- Seed script for demo data

### Gaps & potential improvements

| Gap | Priority | Notes |
|---|---|---|
| Rate limiting on `/vehicles/ping` | Medium | A rogue driver/script could flood the tracking service; add `express-rate-limit` |
| Circuit breaker on Incident→Tracking HTTP call | Low | If Tracking is down, the nearest-responder call inside dispatch fails; add retry/fallback |
| Incident reassignment | Medium | Designed in the API, but end-to-end flow (reassigning to a different vehicle) may not be fully tested |
| Arrival detection | Medium | Currently a distance threshold; needs tuning for real-world Accra coordinates |
| Full-text search on incidents | Low | No search on notes/address; MongoDB Atlas Search or a simple regex index would fix it |
| Mobile-responsive UI | Medium | The admin UI is desktop-first; some pages break on small screens |
| Automated tests | High (for production) | No unit or integration tests written; add Jest + Supertest for backend, Vitest + RTL for frontend |
| Token storage security | Medium | Review whether access tokens are in localStorage (XSS risk) or httpOnly cookies |

---

## 14. Deployment

### Full deployment guides
- `RENDER_DEPLOYMENT.md` — Step-by-step for Render.com
- `RAILWAY_DEPLOYMENT.md` — Step-by-step for Railway.app
- `README.md` — General production checklist

### Production checklist summary
- [ ] Replace all `JWT_SECRET` values with a cryptographically random string (64+ chars)
- [ ] Replace local MongoDB URIs with MongoDB Atlas connection strings (4 separate databases)
- [ ] Replace local RabbitMQ with CloudAMQP (or equivalent managed broker)
- [ ] Set `NODE_ENV=production` on all services
- [ ] Enable HTTPS on nginx (Certbot / Let's Encrypt)
- [ ] Set `restart: unless-stopped` in docker-compose.yml for production
- [ ] Add `ACCESS_CONTROL_ALLOW_ORIGIN` to the specific frontend domain (not `*`)
- [ ] Enable MongoDB Atlas IP whitelisting
- [ ] Change RabbitMQ from default `guest/guest` credentials
- [ ] Build and serve the React frontend from `frontend/dist/` (run `npm run build`)

---

## 15. Design Documentation

All Phase 1 design artefacts are in `phase-1-design/`:

| File | Contents |
|---|---|
| `ARCHITECTURE.md` | System context diagram, service map, technology decisions |
| `DATABASE_DESIGN.md` | Every MongoDB collection schema with field types, indexes, and relationships |
| `API_DEFINITIONS.md` | All REST endpoints across all services with request/response shapes |
| `MESSAGE_QUEUE.md` | RabbitMQ exchange/queue topology, event formats, full message flow diagram |
| `INDEX.md` | Index of all design files |

The live Swagger UIs (at `/api-docs` on each service) are the authoritative API reference during development, as they are auto-generated from the code.

---

## Contact & Context

This project was built as a course project for the **Mobile & Web Software Design & Architecture** course. The codebase is intentionally educational — it demonstrates a wide range of architectural patterns rather than optimising for minimal complexity. Every major decision (why microservices, why RabbitMQ, why separate databases) is explained in `PROJECT_PLAN.md` and `SKILLS.md`.

If you are picking this up:
1. Read `PROJECT_PLAN.md` first for the "why"
2. Run the Docker Compose stack and seed it
3. Log in as `system_admin` and explore all pages
4. Use the GPS Simulator panel on the Live Map to watch the tracking flow end to end
5. Check the RabbitMQ Management UI at `:15672` to watch events flow between services in real time
