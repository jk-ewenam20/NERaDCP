# Emergency Response and Dispatch Platform

A distributed emergency response coordination system for Ghana, built as a microservices architecture using the MERN stack. The platform connects dispatchers, ambulance drivers, police stations, and fire stations in real time, enabling faster incident reporting, nearest-responder dispatch, and live GPS tracking of emergency vehicles.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Running the Frontend](#running-the-frontend)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Production Deployment](#production-deployment)

---

## Overview

The platform handles the full lifecycle of an emergency incident:

1. A dispatcher or citizen reports an incident with a location and type (medical, fire, crime, accident).
2. The system finds the nearest available responder using geospatial queries.
3. The responder is automatically dispatched and begins sending GPS pings.
4. Administrators and dispatchers track vehicles on a live map in real time.
5. Incident data is aggregated into role-specific analytics dashboards.

---

## Architecture

The system is composed of four backend microservices and one React frontend. Services communicate through two patterns:

- **Synchronous HTTP** - used when an immediate response is required (for example, the Incident Service querying the nearest ambulance before confirming a dispatch).
- **Asynchronous RabbitMQ** - used for lifecycle events that other services react to independently (analytics aggregation, tracking session management).

```
                        +-------------------+
                        |     Frontend      |
                        |  React + Vite     |
                        +--------+----------+
                                 |  HTTP + WebSocket
                 +---------------+---------------+
                 |               |               |
        +--------+------+ +------+------+ +------+--------+
        |  Auth Service | |  Incident   | | Tracking      |
        |  :3001        | |  Service    | | Service       |
        |               | |  :3003      | | :3004         |
        |  Users, JWT   | |  Incidents, | | GPS pings,    |
        |  Roles        | |  Resources, | | Socket.io     |
        +---------------+ |  Dispatch   | +------+--------+
                          +------+------+        |
                                 |               |
                         +-------+-------+       |
                         |   RabbitMQ    +-------+
                         |   :5672       |
                         +-------+-------+
                                 |
                        +--------+----------+
                        | Analytics Service |
                        | :3005             |
                        | Aggregated stats  |
                        +-------------------+
```

### Service responsibilities

| Service | Port | Responsibility |
|---|---|---|
| auth-service | 3001 | User registration, login, JWT issuance and refresh, role management |
| incident-service | 3003 | Incident CRUD, hospitals, ambulances, police and fire stations, nearest-unit dispatch |
| tracking-service | 3004 | GPS location updates, Socket.io live map, tracking session lifecycle |
| analytics-service | 3005 | Consumes RabbitMQ events, aggregates incident and responder statistics |
| frontend | 5173 (dev) | React SPA - dashboards, incident management, live map, resource management |

### Communication flow

```
Incident created
  --> Incident Service calls Auth Service (HTTP) to validate JWT
  --> Incident Service queries MongoDB with $near for nearest ambulance
  --> Incident saved, dispatch confirmed (HTTP response to client)
  --> Incident Service publishes incident.created to RabbitMQ
        --> Analytics Service updates counters
        --> Tracking Service opens a tracking session

Vehicle GPS ping
  --> Tracking Service receives ping via Socket.io or HTTP
  --> Tracking Service broadcasts vehicle.location to connected clients
  --> Tracking Service publishes vehicle.location.updated to RabbitMQ
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18, Vite |
| Styling | Tailwind CSS |
| Maps | Leaflet, react-leaflet |
| Charts | Recharts |
| Real-time client | Socket.io-client |
| HTTP client | Axios |
| Backend framework | Express.js |
| Runtime | Node.js 20 |
| Database | MongoDB (separate database per service) |
| ODM | Mongoose |
| Message broker | RabbitMQ (AMQP) |
| Real-time server | Socket.io |
| Authentication | JSON Web Tokens (JWT) - access + refresh token pair |
| Password hashing | bcrypt |
| API documentation | Swagger / OpenAPI (swagger-jsdoc + swagger-ui-express) |
| Containerisation | Docker, Docker Compose |

---

## Project Structure

```
course-project/
|-- auth-service/
|   |-- src/
|   |   |-- app.js
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   +-- scripts/          # seed script
|   |-- Dockerfile
|   |-- .env.example
|   +-- package.json
|
|-- incident-service/         # incidents + all responder resources
|   |-- src/
|   |   |-- app.js
|   |   |-- controllers/      # incident, ambulance, hospital, police, fire
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   +-- scripts/
|   |-- Dockerfile
|   |-- .env.example
|   +-- package.json
|
|-- tracking-service/
|   |-- src/
|   |   |-- app.js
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   +-- routes/
|   |-- Dockerfile
|   |-- .env.example
|   +-- package.json
|
|-- analytics-service/
|   |-- src/
|   |   |-- app.js
|   |   |-- consumers/        # RabbitMQ event consumers
|   |   |-- models/
|   |   +-- routes/
|   |-- Dockerfile
|   |-- .env.example
|   +-- package.json
|
|-- frontend/
|   |-- src/
|   |   |-- api/              # axios instance + per-service API modules
|   |   |-- components/       # UI, Map, Layout components
|   |   |-- contexts/         # AuthContext
|   |   |-- pages/            # Dashboard, Incidents, LiveMap, Resources, Users
|   |   +-- index.css
|   |-- .env.example
|   +-- package.json
|
|-- docker-compose.yml
+-- PROJECT_PLAN.md
```

---

## Prerequisites

Ensure the following are installed before running the project:

- **Node.js** 20 or later - https://nodejs.org
- **npm** 9 or later (bundled with Node.js)
- **Docker** 24 or later - https://docs.docker.com/get-docker
- **Docker Compose** v2 - bundled with Docker Desktop; on Linux install separately

For manual (non-Docker) setup you also need:

- **MongoDB** 7 running locally or a MongoDB Atlas connection string
- **RabbitMQ** 3.12 running locally

---

## Environment Variables

Each service reads its configuration from a `.env` file in its own directory. Copy the `.env.example` file and fill in the values before starting any service.

### auth-service/.env

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/auth_db
JWT_SECRET=change_this_to_a_long_random_string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

### incident-service/.env

```
PORT=3003
MONGODB_URI=mongodb://localhost:27017/incident_db
JWT_SECRET=same_jwt_secret_as_auth_service
RABBITMQ_URL=amqp://localhost:5672
RESPONDER_SERVICE_URL=http://localhost:3003
NODE_ENV=development
```

### tracking-service/.env

```
PORT=3004
MONGODB_URI=mongodb://localhost:27017/tracking_db
JWT_SECRET=same_jwt_secret_as_auth_service
RABBITMQ_URL=amqp://localhost:5672
NODE_ENV=development
```

### analytics-service/.env

```
PORT=3005
MONGODB_URI=mongodb://localhost:27017/analytics_db
JWT_SECRET=same_jwt_secret_as_auth_service
RABBITMQ_URL=amqp://localhost:5672
NODE_ENV=development
```

### frontend/.env

```
# Leave empty in local development - the Vite dev server proxy handles /api/v1/* routing.
# Set to your API gateway URL in production, for example: https://api.yourdomain.com
VITE_API_BASE_URL=
```

> Note: All backend services must share the same `JWT_SECRET`. Tokens are issued by the Auth Service and verified by every other service independently.

---

## Local Development

### Option A - Docker Compose (recommended)

Docker Compose starts all services, four MongoDB instances, and RabbitMQ with a single command.

**1. Copy environment files**

```bash
cp auth-service/.env.example      auth-service/.env
cp incident-service/.env.example  incident-service/.env
cp tracking-service/.env.example  tracking-service/.env
cp analytics-service/.env.example analytics-service/.env
cp frontend/.env.example          frontend/.env
```

Edit each `.env` file. At minimum set a consistent `JWT_SECRET` across all backend services.

When using Docker Compose, the MongoDB and RabbitMQ connection strings should use the service names defined in `docker-compose.yml` instead of `localhost`:

```
# auth-service/.env
MONGODB_URI=mongodb://auth-db:27017/auth_db

# incident-service/.env
MONGODB_URI=mongodb://incident-db:27017/incident_db
RABBITMQ_URL=amqp://rabbitmq:5672

# tracking-service/.env
MONGODB_URI=mongodb://tracking-db:27017/tracking_db
RABBITMQ_URL=amqp://rabbitmq:5672

# analytics-service/.env
MONGODB_URI=mongodb://analytics-db:27017/analytics_db
RABBITMQ_URL=amqp://rabbitmq:5672
```

**2. Start all backend services**

```bash
docker compose up --build
```

This starts:
- auth-service on http://localhost:3001
- incident-service on http://localhost:3003
- tracking-service on http://localhost:3004
- analytics-service on http://localhost:3005
- RabbitMQ management UI on http://localhost:15672 (guest / guest)

**3. Seed initial data (optional)**

```bash
docker compose exec incident-service node src/scripts/seed.js
```

**4. Start the frontend** (see [Running the Frontend](#running-the-frontend))

---

### Option B - Manual (without Docker)

Use this if you want to run services individually or debug without containers.

**1. Start MongoDB and RabbitMQ**

If using local installations:

```bash
# macOS with Homebrew
brew services start mongodb-community
brew services start rabbitmq

# Ubuntu / Debian
sudo systemctl start mongod
sudo systemctl start rabbitmq-server

# Windows - start both services from the Windows Services panel or use WSL
```

**2. Install dependencies for each service**

```bash
cd auth-service      && npm install && cd ..
cd incident-service  && npm install && cd ..
cd tracking-service  && npm install && cd ..
cd analytics-service && npm install && cd ..
```

**3. Copy and configure environment files** (use `localhost` connection strings as shown in the [Environment Variables](#environment-variables) section above).

**4. Start each service in a separate terminal**

```bash
# Terminal 1
cd auth-service && npm run dev

# Terminal 2
cd incident-service && npm run dev

# Terminal 3
cd tracking-service && npm run dev

# Terminal 4
cd analytics-service && npm run dev
```

**5. Seed initial data (optional)**

```bash
cd incident-service && node src/scripts/seed.js
```

---

## Running the Frontend

The frontend is a Vite React app. It is not included in Docker Compose and is always run locally during development.

```bash
cd frontend
npm install
npm run dev
```

The app is available at http://localhost:5173.

The Vite dev server is configured to proxy all `/api/v1/*` requests to the backend services, so no CORS issues arise during development. Leave `VITE_API_BASE_URL` empty in `frontend/.env` for local development.

**Build for production:**

```bash
cd frontend
npm run build
```

The compiled output is written to `frontend/dist/`. Serve this directory with any static file server (nginx, Caddy, Vercel, Netlify, etc.).

---

## API Documentation

Each backend service exposes a Swagger UI at its `/api-docs` path:

| Service | Swagger UI |
|---|---|
| Auth Service | http://localhost:3001/api-docs |
| Incident Service | http://localhost:3003/api-docs |
| Tracking Service | http://localhost:3004/api-docs |
| Analytics Service | http://localhost:3005/api-docs |

All endpoints (except `/api/v1/auth/login` and `/api/v1/auth/register`) require a Bearer token in the `Authorization` header.

### Key endpoint groups

```
Auth Service
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/refresh-token
  GET    /api/v1/auth/profile
  GET    /api/v1/auth/users           (system_admin only)
  PUT    /api/v1/auth/users/:id/status

Incident Service
  POST   /api/v1/incidents
  GET    /api/v1/incidents
  GET    /api/v1/incidents/open
  PUT    /api/v1/incidents/:id/status
  GET    /api/v1/hospitals
  POST   /api/v1/hospitals
  GET    /api/v1/ambulances
  POST   /api/v1/ambulances
  PUT    /api/v1/ambulances/:id/status
  PUT    /api/v1/ambulances/:id/driver
  GET    /api/v1/police-stations
  GET    /api/v1/fire-stations

Tracking Service
  POST   /api/v1/tracking/ping        (GPS location update from driver)
  GET    /api/v1/tracking/active
  WebSocket  (Socket.io)  /           (join room, receive vehicle.location events)

Analytics Service
  GET    /api/v1/analytics/summary
  GET    /api/v1/analytics/incidents
  GET    /api/v1/analytics/responders
```

---

## User Roles

| Role | Description | Key access |
|---|---|---|
| `system_admin` | Platform administrator | Full access to all resources and users |
| `dispatcher` | Incident coordinator | Create and manage incidents |
| `hospital_admin` | Hospital administrator | Manage hospital resources and ambulances |
| `ambulance_driver` | Emergency driver | View open incidents, update vehicle status |
| `police_admin` | Police station administrator | Manage police station resources |
| `fire_admin` | Fire station administrator | Manage fire station resources |

The first `system_admin` account must be created by calling `POST /api/v1/auth/register` directly (via curl or Swagger) with `"role": "system_admin"`. Subsequent users are created through the Users page in the dashboard.

---

## Production Deployment

### Overview

For production, each microservice runs in its own Docker container. The recommended setup uses:

- A Linux VPS (Ubuntu 22.04 or later) or a cloud VM
- Docker and Docker Compose installed on the server
- MongoDB Atlas for managed, persistent databases (one cluster per service, or one cluster with separate databases)
- CloudAMQP or a self-hosted RabbitMQ instance for the message broker
- nginx as a reverse proxy for TLS termination and routing to each service
- A built React bundle served by nginx as a static site

---

### Step 1 - Provision managed services

**MongoDB Atlas**

1. Create a free cluster at https://cloud.mongodb.com
2. Create one database user with read/write permissions
3. Whitelist your server's IP address
4. Create four databases: `auth_db`, `incident_db`, `tracking_db`, `analytics_db`
5. Copy the connection string for each

**CloudAMQP (managed RabbitMQ)**

1. Create a free instance at https://www.cloudamqp.com
2. Copy the AMQP URL from the instance details page (format: `amqps://user:pass@host/vhost`)

---

### Step 2 - Configure production environment files

On the server, create a `.env` file for each service with production values:

```
# auth-service/.env (production)
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/auth_db
JWT_SECRET=a_long_random_secret_minimum_64_characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production

# incident-service/.env (production)
PORT=3003
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/incident_db
JWT_SECRET=same_secret_as_auth_service
RABBITMQ_URL=amqps://user:pass@host.cloudamqp.com/vhost
RESPONDER_SERVICE_URL=http://incident-service:3003
NODE_ENV=production

# tracking-service/.env (production)
PORT=3004
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tracking_db
JWT_SECRET=same_secret_as_auth_service
RABBITMQ_URL=amqps://user:pass@host.cloudamqp.com/vhost
NODE_ENV=production

# analytics-service/.env (production)
PORT=3005
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/analytics_db
JWT_SECRET=same_secret_as_auth_service
RABBITMQ_URL=amqps://user:pass@host.cloudamqp.com/vhost
NODE_ENV=production

# frontend/.env (production)
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

### Step 3 - Build and deploy with Docker Compose

Copy the project to the server (via git clone or scp), then start the backend services:

```bash
# On the server
docker compose -f docker-compose.yml up -d --build
```

If using managed MongoDB and RabbitMQ, edit `docker-compose.yml` to remove the `auth-db`, `incident-db`, `tracking-db`, `analytics-db`, and `rabbitmq` service definitions. The backend services will connect to the managed instances via the URLs in their `.env` files.

Verify all containers are running:

```bash
docker compose ps
```

---

### Step 4 - Build the frontend

Build the React app on your local machine (or in CI):

```bash
cd frontend
cp .env.example .env
# Set VITE_API_BASE_URL=https://api.yourdomain.com in frontend/.env
npm install
npm run build
```

Transfer the `frontend/dist/` directory to the server:

```bash
scp -r frontend/dist/ user@your-server:/var/www/emergency-platform/
```

---

### Step 5 - Configure nginx

Install nginx on the server:

```bash
sudo apt update && sudo apt install nginx -y
```

Create a site configuration at `/etc/nginx/sites-available/emergency-platform`:

```nginx
# Serve the React frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/emergency-platform;
    index index.html;

    # React Router - serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Proxy API requests to backend services
server {
    listen 80;
    server_name api.yourdomain.com;

    location /api/v1/auth/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/incidents/ {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/hospitals/ {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/ambulances/ {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/police-stations/ {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/fire-stations/ {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/tracking/ {
        proxy_pass http://localhost:3004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v1/analytics/ {
        proxy_pass http://localhost:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload nginx:

```bash
sudo ln -s /etc/nginx/sites-available/emergency-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 6 - Enable HTTPS with Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Certbot will automatically update the nginx configuration to redirect HTTP to HTTPS and install the certificate. It sets up auto-renewal via a systemd timer.

---

### Step 7 - Verify the deployment

```bash
# Check all containers are running
docker compose ps

# Check auth service health
curl https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'

# Check nginx logs if anything is not routing correctly
sudo tail -f /var/log/nginx/error.log
```

---

### Production checklist

- [ ] `JWT_SECRET` is at least 64 characters and is identical across all backend services
- [ ] All `.env` files are excluded from version control (check `.gitignore`)
- [ ] MongoDB Atlas IP whitelist includes the server's public IP address
- [ ] HTTPS is enabled on both the frontend domain and the API domain
- [ ] `NODE_ENV=production` is set in all backend `.env` files
- [ ] RabbitMQ credentials are using a non-default username and password (not `guest/guest`)
- [ ] Docker containers are configured to restart automatically: add `restart: unless-stopped` to each service in `docker-compose.yml`

---

### Updating a deployed service

To redeploy after a code change:

```bash
# Pull the latest code
git pull origin main

# Rebuild and restart only the changed service
docker compose up -d --build incident-service

# Or rebuild all services
docker compose up -d --build
```

No downtime is incurred for services that were not rebuilt.
