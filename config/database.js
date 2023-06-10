'use strict';

const mongoose = require('mongoose');

const { config } = require('./env');

/**
 * Open the shared mongoose connection.
 *
 * `mongoose.connect` returns a promise; the original implementation wrapped a
 * non-awaited call in try/catch, so connection failures escaped as unhandled
 * rejections instead of stopping the process. Awaiting it makes failure visible.
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
