'use strict';

const mongoose = require('mongoose');

const AppError = require('../utils/AppError');

/**
 * Reject a malformed id before it reaches the database.
 * Without this, `findById('banana')` throws a mongoose CastError that would
 * surface as a 500 for what is really a client mistake.
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return next(AppError.notFound('Resource not found'));
    }
    return next();
  };
}

module.exports = { validateObjectId };
