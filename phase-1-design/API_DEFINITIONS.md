# API Definitions - All Microservices

All APIs are versioned under `/api/v1/`. All routes (except `/auth/login` and `/auth/register`) require a valid JWT in the `Authorization: Bearer <token>` header.

**Standard Response Envelopes:**

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

---

## Service 1: Auth Service (Port 3001)

| Method | Endpoint                        | Auth Required | Role         | Description                                 |
| ------ | ------------------------------- | ------------- | ------------ | ------------------------------------------- |
| POST   | `/api/v1/auth/register`         | No            | —            | Register a new user                         |
| POST   | `/api/v1/auth/login`            | No            | —            | Login, returns JWT + refresh token          |
| POST   | `/api/v1/auth/refresh-token`    | No            | —            | Exchange refresh token for new access token |
| POST   | `/api/v1/auth/logout`           | Yes           | Any          | Revoke refresh token                        |
| GET    | `/api/v1/auth/profile`          | Yes           | Any          | Get own profile                             |
| PUT    | `/api/v1/auth/profile`          | Yes           | Any          | Update own profile                          |
| GET    | `/api/v1/auth/users`            | Yes           | system_admin | List all users                              |
| GET    | `/api/v1/auth/users/:id`        | Yes           | system_admin | Get user by ID                              |
| PUT    | `/api/v1/auth/users/:id/status` | Yes           | system_admin | Activate/deactivate user                    |
| DELETE | `/api/v1/auth/users/:id`        | Yes           | system_admin | Delete user                                 |

### POST `/api/v1/auth/register`

```json
// Request Body
{
  "name": "Kofi Mensah",
  "email": "kofi@example.com",
  "password": "SecurePass123!",
  "role": "hospital_admin",
  "stationId": "64abc123..."   // Optional: link to hospital/station
}

// Response 201
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "Kofi Mensah", "email": "...", "role": "hospital_admin" }
  }
}
```

### POST `/api/v1/auth/login`

```json
// Request Body
{ "email": "kofi@example.com", "password": "SecurePass123!" }

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",    // Expires in 15 minutes
    "refreshToken": "eyJhbGc...",   // Expires in 7 days
    "user": { "_id": "...", "name": "...", "role": "..." }
  }
}
```

### POST `/api/v1/auth/refresh-token`

```json
// Request Body
{ "refreshToken": "eyJhbGc..." }

// Response 200
{
  "success": true,
  "data": { "accessToken": "eyJhbGc..." }
}
```

---

## Service 2: Responder Management Service (Port 3002)

### Hospitals

| Method | Endpoint                         | Auth Required | Role                         | Description             |
| ------ | -------------------------------- | ------------- | ---------------------------- | ----------------------- |
| POST   | `/api/v1/hospitals`              | Yes           | system_admin                 | Register a new hospital |
| GET    | `/api/v1/hospitals`              | Yes           | Any                          | List all hospitals      |
| GET    | `/api/v1/hospitals/:id`          | Yes           | Any                          | Get hospital details    |
| PUT    | `/api/v1/hospitals/:id`          | Yes           | hospital_admin, system_admin | Update hospital info    |
| PUT    | `/api/v1/hospitals/:id/capacity` | Yes           | hospital_admin               | Update bed availability |
| DELETE | `/api/v1/hospitals/:id`          | Yes           | system_admin                 | Remove hospital         |

### POST `/api/v1/hospitals`

```json
// Request Body
{
  "name": "Korle Bu Teaching Hospital",
  "address": "Guggisberg Ave, Accra",
  "longitude": -0.2209,
  "latitude": 5.5369,
  "totalBeds": 200,
  "availableBeds": 47,
  "contactPhone": "+233302674500",
  "contactEmail": "info@korlebu.gov.gh"
}
```

### PUT `/api/v1/hospitals/:id/capacity`

```json
// Request Body
{ "availableBeds": 45 }
```

### Ambulances

| Method | Endpoint                        | Auth Required | Role                             | Description                             |
| ------ | ------------------------------- | ------------- | -------------------------------- | --------------------------------------- |
| POST   | `/api/v1/ambulances`            | Yes           | hospital_admin, system_admin     | Register ambulance                      |
| GET    | `/api/v1/ambulances`            | Yes           | Any                              | List all ambulances                     |
| GET    | `/api/v1/ambulances/:id`        | Yes           | Any                              | Get ambulance details                   |
| PUT    | `/api/v1/ambulances/:id/status` | Yes           | hospital_admin, ambulance_driver | Update availability status              |
| GET    | `/api/v1/ambulances/available`  | Yes           | Any                              | List available ambulances with location |

### Police Stations

| Method | Endpoint                               | Auth Required | Role                       | Description             |
| ------ | -------------------------------------- | ------------- | -------------------------- | ----------------------- |
| POST   | `/api/v1/police-stations`              | Yes           | system_admin               | Register police station |
| GET    | `/api/v1/police-stations`              | Yes           | Any                        | List all stations       |
| GET    | `/api/v1/police-stations/:id`          | Yes           | Any                        | Get station details     |
| PUT    | `/api/v1/police-stations/:id`          | Yes           | police_admin, system_admin | Update station info     |
| PUT    | `/api/v1/police-stations/:id/status`   | Yes           | police_admin               | Update availability     |
| POST   | `/api/v1/police-stations/:id/officers` | Yes           | police_admin               | Add officer to station  |
| GET    | `/api/v1/police-stations/:id/officers` | Yes           | police_admin, system_admin | List officers           |

### Fire Stations

| Method | Endpoint                              | Auth Required | Role                     | Description           |
| ------ | ------------------------------------- | ------------- | ------------------------ | --------------------- |
| POST   | `/api/v1/fire-stations`               | Yes           | system_admin             | Register fire station |
| GET    | `/api/v1/fire-stations`               | Yes           | Any                      | List all stations     |
| GET    | `/api/v1/fire-stations/:id`           | Yes           | Any                      | Get station details   |
| PUT    | `/api/v1/fire-stations/:id`           | Yes           | fire_admin, system_admin | Update station info   |
| PUT    | `/api/v1/fire-stations/:id/status`    | Yes           | fire_admin               | Update availability   |
| POST   | `/api/v1/fire-stations/:id/personnel` | Yes           | fire_admin               | Add personnel         |
| GET    | `/api/v1/fire-stations/:id/personnel` | Yes           | fire_admin, system_admin | List personnel        |

### Nearest Responder (Internal use by Incident Service)

| Method | Endpoint                     | Auth Required | Role | Description                      |
| ------ | ---------------------------- | ------------- | ---- | -------------------------------- |
| GET    | `/api/v1/responders/nearest` | Yes           | Any  | Find nearest available responder |

### GET `/api/v1/responders/nearest`

```
Query params:
  lat=5.5369
  lng=-0.2209
  type=medical|fire|crime
  maxDistance=50000   (meters, optional, default 50km)
```

```json
// Response 200
{
  "success": true,
  "data": {
    "responder": {
      "unitId": "64abc...",
      "unitType": "ambulance",
      "unitName": "AMB-003 — Korle Bu",
      "hospitalId": "64xyz...",
      "hospitalName": "Korle Bu Teaching Hospital",
      "distanceMeters": 3210,
      "estimatedMinutes": 8
    }
  }
}
```

---

## Service 3: Incident Service (Port 3003)

| Method | Endpoint                       | Auth Required | Role         | Description                         |
| ------ | ------------------------------ | ------------- | ------------ | ----------------------------------- |
| POST   | `/api/v1/incidents`            | Yes           | system_admin | Create new incident + auto-dispatch |
| GET    | `/api/v1/incidents`            | Yes           | system_admin | List all incidents (paginated)      |
| GET    | `/api/v1/incidents/open`       | Yes           | system_admin | List open/active incidents          |
| GET    | `/api/v1/incidents/:id`        | Yes           | system_admin | Get incident details                |
| PUT    | `/api/v1/incidents/:id/status` | Yes           | system_admin | Manually update status              |
| PUT    | `/api/v1/incidents/:id/assign` | Yes           | system_admin | Reassign to different unit          |
| GET    | `/api/v1/incidents/stats`      | Yes           | system_admin | Summary counts by status            |

### POST `/api/v1/incidents`

```json
// Request Body
{
  "citizenName": "Ama Owusu",
  "citizenPhone": "+233244123456",
  "incidentType": "medical",
  "latitude": 5.6037,
  "longitude": -0.1870,
  "address": "Ring Road Central, Accra",
  "notes": "Elderly woman, suspected stroke. Conscious but unable to move."
}

// Response 201
{
  "success": true,
  "data": {
    "incident": {
      "_id": "64incident...",
      "citizenName": "Ama Owusu",
      "incidentType": "medical",
      "status": "dispatched",
      "assignedUnit": {
        "unitId": "...",
        "unitType": "ambulance",
        "unitName": "AMB-003 — Korle Bu",
        "hospitalId": "...",
        "hospitalName": "Korle Bu Teaching Hospital"
      },
      "createdAt": "2025-03-10T09:15:00Z"
    }
  }
}
```

### PUT `/api/v1/incidents/:id/status`

```json
// Request Body
{
  "status": "in_progress" // created | dispatched | in_progress | resolved | cancelled
}
```

### PUT `/api/v1/incidents/:id/assign`

```json
// Request Body
{
  "unitId": "64abc...",
  "unitType": "ambulance"
}
```

---

## Dispatch & Tracking Service (Port 3004)

### HTTP Endpoints

| Method | Endpoint                         | Auth Required | Role                           | Description                       |
| ------ | -------------------------------- | ------------- | ------------------------------ | --------------------------------- |
| POST   | `/api/v1/vehicles/register`      | Yes           | system_admin                   | Register a vehicle for tracking   |
| GET    | `/api/v1/vehicles`               | Yes           | Any                            | List all tracked vehicles         |
| GET    | `/api/v1/vehicles/:id/location`  | Yes           | Any                            | Get current location of a vehicle |
| POST   | `/api/v1/vehicles/:id/location`  | Yes           | ambulance_driver               | Push a GPS location update        |
| GET    | `/api/v1/dispatches`             | Yes           | system_admin                   | List all dispatch records         |
| GET    | `/api/v1/dispatches/:incidentId` | Yes           | system_admin                   | Get dispatch for an incident      |
| PUT    | `/api/v1/dispatches/:id/status`  | Yes           | ambulance_driver, system_admin | Update dispatch status            |

### POST `/api/v1/vehicles/:id/location`

_(Called by the driver's mobile app / simulated for testing)_

```json
// Request Body
{
  "latitude": 5.6200,
  "longitude": -0.1750,
  "speed": 60,
  "heading": 180,
  "incidentId": "64incident..."
}

// Response 200
{ "success": true, "data": { "received": true } }
```

### WebSocket Events (Socket.io)

Clients connect to: `ws://localhost:3004`

#### Client → Server

| Event                  | Payload          | Description                                         |
| ---------------------- | ---------------- | --------------------------------------------------- |
| `subscribe:incident`   | `{ incidentId }` | Subscribe to live updates for an incident           |
| `subscribe:all`        | `{}`             | Subscribe to all vehicle movements (admin map view) |
| `unsubscribe:incident` | `{ incidentId }` | Unsubscribe                                         |

#### Server → Client

| Event                     | Payload                                          | Description               |
| ------------------------- | ------------------------------------------------ | ------------------------- |
| `vehicle:location`        | `{ vehicleId, incidentId, lat, lng, timestamp }` | Real-time position update |
| `dispatch:status_changed` | `{ incidentId, status, timestamp }`              | Dispatch status update    |
| `vehicle:arrived`         | `{ vehicleId, incidentId, arrivedAt }`           | Vehicle arrived at scene  |

---

## Service 4: Analytics Service (Port 3005)

| Method | Endpoint                                 | Auth Required | Role | Description                           |
| ------ | ---------------------------------------- | ------------- | ---- | ------------------------------------- |
| GET    | `/api/v1/analytics/response-times`       | Yes           | Any  | Average response times by type/period |
| GET    | `/api/v1/analytics/incidents-by-region`  | Yes           | Any  | Incident counts by region/type        |
| GET    | `/api/v1/analytics/resource-utilization` | Yes           | Any  | Hospital capacity, vehicle deployment |
| GET    | `/api/v1/analytics/incidents-by-type`    | Yes           | Any  | Breakdown by incident type            |
| GET    | `/api/v1/analytics/top-responders`       | Yes           | Any  | Most frequently deployed responders   |
| GET    | `/api/v1/analytics/overview`             | Yes           | Any  | Dashboard summary stats               |

### GET `/api/v1/analytics/response-times`

```
Query params:
  from=2025-01-01
  to=2025-03-01
  incidentType=medical     (optional)
  periodType=day|month     (optional, default: month)
```

```json
// Response 200
{
  "success": true,
  "data": {
    "periods": [
      {
        "period": "2025-03",
        "incidentType": "medical",
        "avgResponseTimeMinutes": 12.4,
        "totalIncidents": 87,
        "resolvedIncidents": 81
      }
    ]
  }
}
```

### GET `/api/v1/analytics/resource-utilization`

```json
// Response 200
{
  "success": true,
  "data": {
    "hospitals": [
      {
        "hospitalId": "...",
        "name": "Korle Bu Teaching Hospital",
        "totalBeds": 200,
        "availableBeds": 47,
        "occupancyPercent": 76.5,
        "activeAmbulances": 8,
        "deployedAmbulances": 3
      }
    ],
    "policeStations": [
      { "stationId": "...", "name": "...", "activeIncidents": 2 }
    ],
    "fireStations": [
      { "stationId": "...", "name": "...", "activeIncidents": 0 }
    ]
  }
}
```

### GET `/api/v1/analytics/overview`

```json
// Response 200
{
  "success": true,
  "data": {
    "totalIncidents": 1243,
    "openIncidents": 12,
    "resolvedToday": 7,
    "avgResponseTimeMinutes": 14.2,
    "incidentsByType": {
      "medical": 620,
      "fire": 180,
      "crime": 310,
      "accident": 133
    }
  }
}
```

---

## API Gateway Routes (nginx)

```nginx
# Auth Service
location /api/v1/auth/ {
  proxy_pass http://auth-service:3001;
}

# Responder Management Service
location /api/v1/hospitals/ { proxy_pass http://responder-service:3002; }
location /api/v1/ambulances/ { proxy_pass http://responder-service:3002; }
location /api/v1/police-stations/ { proxy_pass http://responder-service:3002; }
location /api/v1/fire-stations/ { proxy_pass http://responder-service:3002; }
location /api/v1/responders/ { proxy_pass http://responder-service:3002; }

# Incident Service
location /api/v1/incidents/ {
  proxy_pass http://incident-service:3003;
}

# Dispatch & Tracking Service
location /api/v1/vehicles/ { proxy_pass http://tracking-service:3004; }
location /api/v1/dispatches/ { proxy_pass http://tracking-service:3004; }

# WebSocket upgrade for tracking
location /socket.io/ {
  proxy_pass http://tracking-service:3004;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}

# Analytics Service
location /api/v1/analytics/ {
  proxy_pass http://analytics-service:3005;
}
```
