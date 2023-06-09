'use strict';

const mongoose = require('mongoose');

const { config } = require('./env');

/**
 * Open the shared mongoose connection.
 *
 * Awaited, so a connection failure rejects `start()` in server.js and stops
 * the process instead of surfacing later as an unhandled rejection.
 */
async function connect(url = config.databaseUrl) {
  mongoose.set('strictQuery', false);
  await mongoose.connect(url, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect };
