# Message Queue Design — RabbitMQ

## Why RabbitMQ?

RabbitMQ is used for **asynchronous, event-driven** communication between services where:
- The publisher doesn't need an immediate response
- Multiple services may need to react to the same event
- Services should remain decoupled (Incident Service should not directly call Analytics Service)

**Direct HTTP (axios)** is used when:
- An immediate response is needed (e.g., Incident Service needs nearest responder from Responder Service to complete the API response)

---

## Broker Configuration

```
Host: rabbitmq (Docker service name)
Port: 5672 (AMQP)
Management UI: Port 15672
```

---

## Exchange Definitions

### Exchange 1: `incident.events`
- **Type:** `topic`
- **Durable:** true

Used for all lifecycle events of emergency incidents.

### Exchange 2: `tracking.events`
- **Type:** `topic`
- **Durable:** true

Used for vehicle location and dispatch status events.

---

## Queue Definitions

### Queues bound to `incident.events`

| Queue Name | Binding Key | Consumer Service | Description |
|------------|------------|-----------------|-------------|
| `analytics.incident.created` | `incident.created` | Analytics Service | Record new incident snapshot |
| `analytics.incident.dispatched` | `incident.dispatched` | Analytics Service | Log dispatch time |
| `analytics.incident.resolved` | `incident.resolved` | Analytics Service | Compute response time |
| `analytics.incident.status` | `incident.status_changed` | Analytics Service | General status tracking |
| `tracking.incident.dispatched` | `incident.dispatched` | Tracking Service | Create dispatch record |

### Queues bound to `tracking.events`

| Queue Name | Binding Key | Consumer Service | Description |
|------------|------------|-----------------|-------------|
| `analytics.vehicle.location` | `vehicle.location_updated` | Analytics Service | Aggregate location data |
| `incident.vehicle.arrived` | `vehicle.arrived` | Incident Service | Auto-update incident to `in_progress` |

---

## Event Message Structures

All messages are JSON. All timestamps are ISO 8601 UTC strings.

---

### `incident.created`
*Published by: Incident Service*
*Consumed by: Analytics Service*

```json
{
  "eventType": "incident.created",
  "timestamp": "2025-03-10T09:15:00Z",
  "payload": {
    "incidentId": "64abc123...",
    "incidentType": "medical",
    "latitude": 5.6037,
    "longitude": -0.1870,
    "address": "Ring Road Central, Accra",
    "region": "Greater Accra",
    "createdBy": "64admin...",
    "createdAt": "2025-03-10T09:15:00Z"
  }
}
```

---

### `incident.dispatched`
*Published by: Incident Service*
*Consumed by: Analytics Service, Tracking Service*

```json
{
  "eventType": "incident.dispatched",
  "timestamp": "2025-03-10T09:15:30Z",
  "payload": {
    "incidentId": "64abc123...",
    "incidentType": "medical",
    "latitude": 5.6037,
    "longitude": -0.1870,
    "assignedUnit": {
      "unitId": "64unit...",
      "unitType": "ambulance",
      "unitName": "AMB-003 — Korle Bu",
      "hospitalId": "64hosp...",
      "driverId": "64driver..."
    },
    "dispatchedAt": "2025-03-10T09:15:30Z"
  }
}
```

---

### `incident.status_changed`
*Published by: Incident Service*
*Consumed by: Analytics Service*

```json
{
  "eventType": "incident.status_changed",
  "timestamp": "2025-03-10T09:28:00Z",
  "payload": {
    "incidentId": "64abc123...",
    "previousStatus": "dispatched",
    "newStatus": "in_progress",
    "changedBy": "64admin...",
    "changedAt": "2025-03-10T09:28:00Z"
  }
}
```

---

### `incident.resolved`
*Published by: Incident Service*
*Consumed by: Analytics Service*

```json
{
  "eventType": "incident.resolved",
  "timestamp": "2025-03-10T09:45:00Z",
  "payload": {
    "incidentId": "64abc123...",
    "incidentType": "medical",
    "region": "Greater Accra",
    "createdAt": "2025-03-10T09:15:00Z",
    "dispatchedAt": "2025-03-10T09:15:30Z",
    "resolvedAt": "2025-03-10T09:45:00Z",
    "responseTimeMinutes": 29.5,
    "assignedUnitType": "ambulance"
  }
}
```

---

### `vehicle.location_updated`
*Published by: Tracking Service (on each GPS ping)*
*Consumed by: Analytics Service*

```json
{
  "eventType": "vehicle.location_updated",
  "timestamp": "2025-03-10T09:22:15Z",
  "payload": {
    "vehicleId": "64veh...",
    "vehicleType": "ambulance",
    "incidentId": "64abc123...",
    "latitude": 5.6100,
    "longitude": -0.1800,
    "speed": 55,
    "recordedAt": "2025-03-10T09:22:15Z"
  }
}
```

---

### `vehicle.arrived`
*Published by: Tracking Service*
*Consumed by: Incident Service (auto-update status to `in_progress`)*

```json
{
  "eventType": "vehicle.arrived",
  "timestamp": "2025-03-10T09:28:00Z",
  "payload": {
    "vehicleId": "64veh...",
    "vehicleType": "ambulance",
    "incidentId": "64abc123...",
    "arrivedAt": "2025-03-10T09:28:00Z"
  }
}
```

---

## Communication Flow: New Incident End-to-End

```
System Admin submits incident form
         │
         ▼
[Incident Service]
  1. Save incident (status: "created")
  2. Call Responder Service HTTP GET /responders/nearest
         │
         ▼
[Responder Service]
  3. Run $near geospatial query
  4. Return nearest available unit
         │
         ▼
[Incident Service]
  5. Update incident (status: "dispatched", assignedUnit: {...})
  6. Return 201 response to admin ←── Admin sees dispatched confirmation
  7. Publish incident.dispatched to RabbitMQ
         │
         ├──▶ [Analytics Service] records dispatch log
         │
         └──▶ [Tracking Service] creates dispatch record
                       │
                       ▼
              [Driver's phone/app]
                 pushes GPS pings
                       │
                       ▼
              [Tracking Service]
                upserts live_positions
                emits vehicle:location
                via WebSocket
                       │
                       ▼
              [React Admin Dashboard]
                shows live vehicle
                movement on map

When vehicle arrives at scene:
  [Tracking Service] publishes vehicle.arrived
         │
         ▼
  [Incident Service] auto-updates status → "in_progress"

When incident resolved by admin:
  [Incident Service] publishes incident.resolved
         │
         ▼
  [Analytics Service] computes and stores response time
```

---

## RabbitMQ Setup Code Pattern (Node.js / amqplib)

```js
// shared/rabbitmq.js (copied into each service or as an npm package)
const amqp = require('amqplib');

let connection, channel;

async function connect() {
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();

  // Declare exchanges (idempotent — safe to call multiple times)
  await channel.assertExchange('incident.events', 'topic', { durable: true });
  await channel.assertExchange('tracking.events', 'topic', { durable: true });
}

async function publish(exchange, routingKey, message) {
  channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
}

async function consume(exchange, routingKey, queueName, handler) {
  await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(queueName, exchange, routingKey);
  channel.consume(queueName, async (msg) => {
    if (msg) {
      const content = JSON.parse(msg.content.toString());
      await handler(content);
      channel.ack(msg);
    }
  });
}

module.exports = { connect, publish, consume };
```
