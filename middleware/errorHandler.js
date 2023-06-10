'use strict';

const { config } = require('../config/env');
const AppError = require('../utils/AppError');

const MONGO_DUPLICATE_KEY = 11000;

/** Terminal 404 for any path the router did not match. */
function notFoundHandler(req, res, next) {
  next(AppError.notFound(`No route matches ${req.method} ${req.path}`));
}

/**
 * Turn a thrown value into something the API is willing to describe.
 *
 * Services check uniqueness before inserting, but two simultaneous
 * registrations can still both pass that check and let the unique index decide.
 * A duplicate-key error is the client's problem, not a server fault, so it is
 * reported as the same 409 the pre-check would have produced. Everything else
 * that is not an `AppError` stays an unexpected fault.
 */
function translateError(err) {
  if (err instanceof AppError || err?.expected === true) return err;

  if (err?.code === MONGO_DUPLICATE_KEY) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    return AppError.conflict(
      field ? `That ${field} is already taken` : 'That value is already taken',
      field ? { field } : undefined
    );
  }

  return null;
}

/**
 * Single error responder.
 *
 * Anything untranslatable is an unexpected fault: it is logged server-side and
 * reported as a bare 500. Leaking `err.message` from an arbitrary throw can
 * disclose database internals, file paths or query text.
 */
// The unused `next` is required: express identifies an error handler by arity.
function errorHandler(err, req, res, next) {
  const translated = translateError(err);
  const status = translated ? translated.status : 500;

  if (!translated && !config.isTest) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error', err);
  }

  const body = {
    error: {
      status,
      message: translated ? translated.message : 'Internal server error',
    },
  };
  if (translated?.details) body.error.details = translated.details;
  if (!translated && config.environment === 'development') body.error.debug = err.message;

  if (typeof res.respond === 'function') return res.respond(status, body);
  return res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler, translateError };
