const Redis = require("ioredis");
const logger = require("../utils/logger");

let client = null;

const getRedisClient = () => {
  if (client) return client;

  client = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 5) return null; 
      return Math.min(times * 100, 2000);
    },
  });

  client.on("connect", () => logger.info("Redis connected"));
  client.on("error", (err) => logger.error(`Redis error: ${err.message}`));

  return client;
};

module.exports = { getRedisClient };
