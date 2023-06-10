'use strict';

require('dotenv').config();

/**
 * Centralised, validated configuration.
 *
 * Every value the app reads from the environment is resolved here exactly once,
 * so nothing else in the codebase touches `process.env` directly. Missing
 * required values fail loudly at boot rather than silently at request time.
 */

const DEFAULTS = {
  ENVIRONMENT: 'development',
  SERVER_PORT: 3000,
  JWT_EXPIRES_IN: '1h',
  BCRYPT_ROUNDS: 10,
  PAGE_SIZE_DEFAULT: 20,
  PAGE_SIZE_MAX: 100,
};

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || DEFAULTS.ENVIRONMENT;
const isTest = environment === 'test';

const config = {
  environment,
  isTest,
  isProduction: environment === 'production',
  port: toInt(process.env.SERVER_PORT, DEFAULTS.SERVER_PORT),
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULTS.JWT_EXPIRES_IN,
  },
  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, DEFAULTS.BCRYPT_ROUNDS),
  pagination: {
    defaultLimit: toInt(process.env.PAGE_SIZE_DEFAULT, DEFAULTS.PAGE_SIZE_DEFAULT),
    maxLimit: toInt(process.env.PAGE_SIZE_MAX, DEFAULTS.PAGE_SIZE_MAX),
  },
  /**
   * Author names that are not welcome on Wookie Books.
   * Comparison is case-insensitive and whitespace-normalised.
   */
  bannedAuthorPseudonyms: (process.env.BANNED_AUTHOR_PSEUDONYMS || 'Darth Vader')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean),
};

/**
 * Assert that the variables the process cannot run without are present.
 * Called from `server.js`, never from `app.js`, so tests can build the app
 * without a real database URL.
 */
function assertRuntimeConfig() {
  const missing = [];
  if (!config.databaseUrl) missing.push('DATABASE_URL');
  if (!config.jwt.secret) missing.push('JWT_SECRET_KEY');
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.sample to .env and fill them in.'
    );
  }
}

module.exports = { config, assertRuntimeConfig };
