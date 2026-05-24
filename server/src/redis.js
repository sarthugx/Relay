const { createClient } = require('redis');

const REDIS_URL =
  process.env.REDIS_URL || 'redis://localhost:16379';

const isProduction = REDIS_URL.startsWith('rediss://');

const redisConfig = {
  url: REDIS_URL,
};

if (isProduction) {
  redisConfig.socket = {
    tls: true,
    keepAlive: 30000,
    reconnectStrategy: (retries) => {
      return Math.min(retries * 100, 3000);
    },
  };
}

const pubClient = createClient(redisConfig);
const subClient = pubClient.duplicate();

pubClient.on('error', (err) => {
  console.error('Redis Pub Client Error', err);
});

subClient.on('error', (err) => {
  console.error('Redis Sub Client Error', err);
});

module.exports = {
  pubClient,
  subClient,
};