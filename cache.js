const { createClient } = require("redis");

const url = process.env.REDIS_URI;

const cache = createClient({
  socket: {
    url,
  },
});

cache.connect();

module.exports = cache;
