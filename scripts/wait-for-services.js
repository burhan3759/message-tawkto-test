const net = require('net');

const services = [
  { host: process.env.WAIT_MONGO_HOST || 'mongo', port: Number(process.env.WAIT_MONGO_PORT || '27017'), name: 'mongo' },
  { host: process.env.WAIT_KAFKA_HOST || 'kafka', port: Number(process.env.WAIT_KAFKA_PORT || '9092'), name: 'kafka' },
  { host: process.env.WAIT_ELASTIC_HOST || 'elasticsearch', port: Number(process.env.WAIT_ELASTIC_PORT || '9200'), name: 'elasticsearch' },
];

const timeoutMs = Number(process.env.WAIT_TIMEOUT_MS || '180000');
const retryDelayMs = Number(process.env.WAIT_RETRY_DELAY_MS || '1000');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const finish = (ok) => {
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(1500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function waitForService(service) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const ok = await canConnect(service.host, service.port);
    if (ok) {
      console.log(`Service ready: ${service.name} (${service.host}:${service.port})`);
      return;
    }

    await sleep(retryDelayMs);
  }

  throw new Error(`Timed out waiting for ${service.name} at ${service.host}:${service.port}`);
}

(async () => {
  for (const service of services) {
    await waitForService(service);
  }

  console.log('All dependent services are reachable.');
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
