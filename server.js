'use strict';

const { config, assertRuntimeConfig } = require('./config/env');

/**
 * Process entry point: validate configuration, connect to MongoDB, then serve.
 *
 * Configuration is asserted *before* `./app` is required. Building the app
 * constructs the passport JWT strategy, which throws
 * `TypeError: JwtStrategy requires a secret or key` at import time if
 * JWT_SECRET_KEY is unset — a stack trace out of node_modules instead of a
 * sentence naming the missing variable.
 *
 * The original app also called `app.listen` at module scope, so importing it
 * for any reason — a test, a script — opened a real socket.
 */
async function start() {
  assertRuntimeConfig();

  const app = require('./app');
  const database = require('./config/database');

  await database.connect();

  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Wookie Books API listening on port ${config.port} (${config.environment})`);
  });

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`Received ${signal}, shutting down`);
    server.close();
    await database.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start Wookie Books API:', error.message);
  process.exit(1);
});
