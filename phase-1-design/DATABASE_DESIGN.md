# Database Design — All Microservices

Each microservice owns its own MongoDB database. No service reads directly from another service's database.

---

## 1. Auth Service — `auth_db`

### Collection: `users`

```js
{
  _id: ObjectId,
  name: String,                          // Full name
  email: String,                         // Unique, indexed
  passwordHash: String,                  // bcrypt hash
  role: {
    type: String,
    enum: [
      "system_admin",
      "hospital_admin",
      "police_admin",
      "fire_admin",
      "ambulance_driver"
    ]
  },
  stationId: ObjectId,                   // ID from Responder Service (optional)
                                         // Links hospital admin → hospital
                                         // Links police admin → police station
                                         // Links fire admin → fire station
                                         // Links driver → ambulance
  isActive: Boolean,                     // Default: true
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email`: unique

### Collection: `refresh_tokens`

```js
{
  _id: ObjectId,
  userId: ObjectId,                      // Ref to users._id
  token: String,                         // Hashed refresh token
  expiresAt: Date,
  createdAt: Date
}
```

**Indexes:**
- `token`: unique
- `expiresAt`: TTL index (auto-delete expired tokens)

---

## 2. Responder Management Service — `responder_db`

### Collection: `hospitals`

```js
{
  _id: ObjectId,
  name: String,
  address: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number]                // [longitude, latitude]  ← GeoJSON format
  },
  totalBeds: Number,
  availableBeds: Number,
  contactPhone: String,
  contactEmail: String,
  status: {
    type: String,
    enum: ["active", "inactive", "full"]
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `location`: `2dsphere` (required for geospatial queries)

### Collection: `ambulances`

```js
{
  _id: ObjectId,
  vehicleNumber: String,                 // e.g., "AMB-001"
  hospitalId: ObjectId,                  // Ref to hospitals._id
  driverId: ObjectId,                    // Ref to auth users._id
  status: {
    type: String,
    enum: ["available", "dispatched", "out_of_service"]
  },
  currentLocation: {
    type: { type: String, default: "Point" },
    coordinates: [Number]                // [longitude, latitude]
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `currentLocation`: `2dsphere`
- `hospitalId`: standard index

### Collection: `police_stations`

```js
{
  _id: ObjectId,
  name: String,
  address: String,
  region: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number]                // [longitude, latitude]
  },
  contactPhone: String,
  status: {
    type: String,
    enum: ["active", "inactive"]
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `location`: `2dsphere`

### Collection: `police_officers`

```js
{
  _id: ObjectId,
  userId: ObjectId,                      // Ref to auth users._id
  stationId: ObjectId,                   // Ref to police_stations._id
  badgeNumber: String,
  rank: String,
  isOnDuty: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `fire_stations`

```js
{
  _id: ObjectId,
  name: String,
  address: String,
  region: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number]
  },
  contactPhone: String,
  status: {
    type: String,
    enum: ["active", "inactive"]
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `location`: `2dsphere`

### Collection: `fire_personnel`

```js
{
  _id: ObjectId,
  userId: ObjectId,
  stationId: ObjectId,                   // Ref to fire_stations._id
  badgeNumber: String,
  rank: String,
  isOnDuty: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. Incident Service — `incident_db`

### Collection: `incidents`

```js
{
  _id: ObjectId,
  citizenName: String,
  citizenPhone: String,                  // Optional
  incidentType: {
    type: String,
    enum: ["medical", "fire", "crime", "accident", "other"]
  },
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number]                // [longitude, latitude]
  },
  address: String,                       // Human-readable address from reverse geocode
  notes: String,
  createdBy: ObjectId,                   // Auth user ID (system admin)
  assignedUnit: {
    unitId: ObjectId,                    // Responder Service entity ID
    unitType: {
      type: String,
      enum: ["ambulance", "police_station", "fire_station"]
    },
    unitName: String,                    // Denormalized for display
    hospitalId: ObjectId                 // For medical: the receiving hospital
  },
  status: {
    type: String,
    enum: ["created", "dispatched", "in_progress", "resolved", "cancelled"],
    default: "created"
  },
  statusHistory: [
    {
      status: String,
      changedAt: Date,
      changedBy: ObjectId
    }
  ],
  dispatchedAt: Date,
  resolvedAt: Date,
  responseTimeMinutes: Number,           // Computed on resolve
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `location`: `2dsphere`
- `status`: standard index
- `incidentType`: standard index
- `createdAt`: descending index (for recent incidents)

---

## 4. Dispatch & Tracking Service — `tracking_db`

### Collection: `dispatch_records`

```js
{
  _id: ObjectId,
  incidentId: ObjectId,                  // Ref to Incident Service incident ID
  vehicleId: ObjectId,                   // Ambulance, police vehicle, or fire truck ID
  vehicleType: {
    type: String,
    enum: ["ambulance", "police_vehicle", "fire_truck"]
  },
  driverId: ObjectId,                    // Auth user ID of driver/officer
  dispatchedAt: Date,
  arrivedAt: Date,
  completedAt: Date,
  status: {
    type: String,
    enum: ["en_route", "arrived", "completed", "cancelled"]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `vehicle_locations`

```js
{
  _id: ObjectId,
  vehicleId: ObjectId,
  vehicleType: String,
  incidentId: ObjectId,                  // Active incident being responded to
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number]                // [longitude, latitude]
  },
  speed: Number,                         // Optional, km/h
  heading: Number,                       // Optional, degrees
  recordedAt: Date,
  createdAt: Date
}
```

**Indexes:**
- `location`: `2dsphere`
- `vehicleId + recordedAt`: compound index (for location history queries)
- `recordedAt`: TTL index (optional: auto-delete location pings older than 7 days)

### Collection: `live_positions`
*(One document per vehicle — upserted on each ping for fast current-location lookups)*

```js
{
  _id: ObjectId,
  vehicleId: ObjectId,                   // Unique
  vehicleType: String,
  incidentId: ObjectId,
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number]
  },
  lastUpdated: Date
}
```

**Indexes:**
- `vehicleId`: unique
- `location`: `2dsphere`

---

## 5. Analytics Service — `analytics_db`

### Collection: `incident_snapshots`
*(Populated by consuming RabbitMQ events — denormalized for fast aggregation)*

```js
{
  _id: ObjectId,
  incidentId: ObjectId,
  incidentType: String,
  region: String,
  latitude: Number,
  longitude: Number,
  status: String,
  assignedUnitType: String,
  responseTimeMinutes: Number,
  dispatchedAt: Date,
  resolvedAt: Date,
  createdAt: Date
}
```

### Collection: `hospital_capacity_logs`

```js
{
  _id: ObjectId,
  hospitalId: ObjectId,
  hospitalName: String,
  totalBeds: Number,
  availableBeds: Number,
  occupancyPercent: Number,
  recordedAt: Date
}
```

### Collection: `response_time_summaries`
*(Pre-aggregated for fast dashboard queries)*

```js
{
  _id: ObjectId,
  period: String,                        // e.g., "2025-03", "2025-03-15"
  periodType: String,                    // "day" | "month"
  incidentType: String,
  region: String,
  avgResponseTimeMinutes: Number,
  totalIncidents: Number,
  resolvedIncidents: Number,
  computedAt: Date
}
```

---

## Geospatial Query Pattern (Critical)

MongoDB `$near` query used in Incident Service to find nearest available responder:

```js
// Find nearest available ambulance to an incident location
db.ambulances.find({
  status: "available",
  currentLocation: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [incidentLongitude, incidentLatitude]
      },
      $maxDistance: 50000   // 50 km radius in meters
    }
  }
}).limit(1)
```

> **Note:** GeoJSON stores coordinates as `[longitude, latitude]` — the reverse of what most people expect. Always store and query in this order.
