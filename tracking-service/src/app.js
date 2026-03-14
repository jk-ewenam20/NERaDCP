require('dotenv').config();
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/database');
const mq = require('./config/rabbitmq');
const vehicleRoutes = require('./routes/vehicle.routes');
const dispatchRoutes = require('./routes/dispatch.routes');
const incidentConsumer = require('./consumers/incident.consumer');
const vehicleService = require('./services/vehicle.service');
const dispatchService = require('./services/dispatch.service');

const app = express();
const server = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Inject io into services that need to emit events
vehicleService.setIo(io);
dispatchService.setIo(io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('subscribe:all', () => {
    socket.join('all');
  });

  socket.on('subscribe:incident', ({ incidentId }) => {
    socket.join(`incident:${incidentId}`);
  });

  socket.on('unsubscribe:incident', ({ incidentId }) => {
    socket.leave(`incident:${incidentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Swagger ───────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Dispatch & Tracking Service API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/dispatches', dispatchRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'tracking-service' }));

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3003;

async function start() {
  await connectDB();
  await mq.connect();
  await incidentConsumer.startConsumers();

  server.listen(PORT, () => {
    console.log(`Tracking Service running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    console.log(`WebSocket ready on ws://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start Tracking Service:', err);
  process.exit(1);
});
