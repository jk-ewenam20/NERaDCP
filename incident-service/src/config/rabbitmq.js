const amqp = require('amqplib');

let connection = null;
let channel = null;
let isReconnecting = false;

// All consumer registrations are stored so they can be replayed after reconnect
const registeredConsumers = [];

const EXCHANGES = [
  { name: 'incident.events', type: 'topic' },
  { name: 'tracking.events', type: 'topic' },
];

async function connect() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Without these handlers Node.js throws an unhandled 'error' event and crashes
    connection.on('error', (err) => {
      console.error('[RabbitMQ] Connection error:', err.message);
      scheduleReconnect();
    });
    connection.on('close', () => {
      console.warn('[RabbitMQ] Connection closed — reconnecting in 5 s');
      scheduleReconnect();
    });
    channel.on('error', (err) => {
      console.error('[RabbitMQ] Channel error:', err.message);
    });

    for (const ex of EXCHANGES) {
      await channel.assertExchange(ex.name, ex.type, { durable: true });
    }

    // Re-bind all consumers that were registered before the reconnect
    for (const cfg of registeredConsumers) {
      await _bindConsumer(cfg);
    }

    console.log('[Incident Service] RabbitMQ connected');
  } catch (err) {
    console.error('[RabbitMQ] Failed to connect:', err.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (isReconnecting) return;
  isReconnecting = true;
  setTimeout(async () => {
    isReconnecting = false;
    await connect();
  }, 5000);
}

async function _bindConsumer({ exchange, routingKey, queueName, handler }) {
  await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(queueName, exchange, routingKey);
  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      const content = JSON.parse(msg.content.toString());
      await handler(content);
      channel.ack(msg);
    } catch (err) {
      console.error(`[RabbitMQ] Handler error on ${queueName}:`, err.message);
      channel.nack(msg, false, false);
    }
  });
}

async function consume(exchange, routingKey, queueName, handler) {
  const cfg = { exchange, routingKey, queueName, handler };
  registeredConsumers.push(cfg);
  if (channel) await _bindConsumer(cfg);
}

async function publish(exchange, routingKey, message) {
  if (!channel) {
    console.warn('[RabbitMQ] Cannot publish — channel not ready');
    throw new Error('RabbitMQ channel not available');
  }
  try {
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (err) {
    console.error('[RabbitMQ] Publish error:', err.message);
    throw err;
  }
}

module.exports = { connect, publish, consume };
