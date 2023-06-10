'use strict';

const express = require('express');
const morgan = require('morgan');

const { config } = require('./config/env');
const passport = require('./config/passport');
const routes = require('./routes');
const { responseFormat } = require('./middleware/responseFormat');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

/**
 * Build the express application.
 *
 * This module deliberately does not listen on a port and does not open a
 * database connection — `server.js` does both. Keeping construction separate
 * from startup is what lets the test suite mount the app against an in-memory
 * MongoDB with supertest and no open socket.
 */
function createApp() {
  const app = express();

  app.disable('x-powered-by');

  if (!config.isTest) {
    app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  }

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(passport.initialize());
  app.use(responseFormat);

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
