const { createClient } = require("async-redis");
const config = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};
const cache = createClient(config);
cache.auth(process.env.REDIS_PASSWORD);

module.exports = cache;
