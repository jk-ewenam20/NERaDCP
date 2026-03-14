require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/database');
const mq = require('./config/rabbitmq');
const incidentRoutes = require('./routes/incident.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const ambulanceRoutes = require('./routes/ambulance.routes');
const policeStationRoutes = require('./routes/policeStation.routes');
const fireStationRoutes = require('./routes/fireStation.routes');
const responderRoutes = require('./routes/responder.routes');
const vehicleConsumer = require('./consumers/vehicle.consumer');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Swagger ───────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Emergency Incident Service API', version: '1.0.0' },
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
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/ambulances', ambulanceRoutes);
app.use('/api/v1/police-stations', policeStationRoutes);
app.use('/api/v1/fire-stations', fireStationRoutes);
app.use('/api/v1/responders', responderRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'emergency-incident-service' }));

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3002;

async function start() {
  await connectDB();
  await mq.connect();
  await vehicleConsumer.startConsumers();

  app.listen(PORT, () => {
    console.log(`Emergency Incident Service running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

start().catch((err) => {
  console.error('Failed to start Emergency Incident Service:', err);
  process.exit(1);
});
