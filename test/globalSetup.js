'use strict';

const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Start one in-memory MongoDB for the whole run.
 *
 * The suite talks to a real MongoDB wire protocol — mongoose behaviour, index
 * definitions and query operators are all exercised for real — but the server
 * is a local process with an ephemeral data directory. No external network call
 * is made at any point during the tests.
 */
module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create({ binary: { version: '8.2.6' } });
  global.__MONGOD__ = mongod;
  process.env.MONGO_TEST_URI = mongod.getUri();
};
