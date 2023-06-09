'use strict';

/**
 * An error the API deliberately produced and knows how to render.
 *
 * Anything thrown that is *not* an AppError is treated as an unexpected fault
 * by the error handler: it is logged and reported as a bare 500, never echoed
 * back to the client.
 */
class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.expected = true;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace(this, AppError);
  }

  static badRequest(message, details) {
    return new AppError(400, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, message);
  }

  static forbidden(message = 'You do not have permission to do that') {
    return new AppError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, message);
  }

  static conflict(message, details) {
    return new AppError(409, message, details);
  }
}

module.exports = AppError;
