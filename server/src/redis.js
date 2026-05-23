const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:16379';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

pubClient.on('error', (err) => console.log('Redis Pub Client Error', err));
subClient.on('error', (err) => console.log('Redis Sub Client Error', err));

module.exports = {
  pubClient,
  subClient
};
