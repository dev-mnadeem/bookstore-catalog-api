'use strict';

const AppError = require('../utils/AppError');

const JOI_OPTIONS = { abortEarly: false, stripUnknown: true, convert: true };

/**
 * Validate a request against a Joi schema.
 *
 * The original validator responded to a validation failure with
 * `res.send(error)` — HTTP 200, carrying a serialised Joi error object
 * including the caller's own input. A rejected request now returns 400 with a
 * field/message list, and the validated (and stripped) value replaces the raw
 * input so handlers never see unknown keys.
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], JOI_OPTIONS);
    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(AppError.badRequest('Request validation failed', details));
    }
    if (property === 'body') req.body = value;
    else req.validatedQuery = value;
    return next();
  };
}

module.exports = { validate };
