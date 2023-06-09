'use strict';

const passport = require('../config/passport');
const AppError = require('../utils/AppError');

/**
 * Route-level authentication.
 *
 * Each router declares its own requirement instead of one global middleware
 * guessing from the URL, so a reader can see from routes/books.js alone that
 * the catalogue is public.
 */

function requireAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return next(AppError.unauthorized(info?.message || 'Authentication required'));
    req.user = user;
    return next();
  })(req, res, next);
}

function localLogin(req, res, next) {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return next(AppError.unauthorized(info?.message || 'Invalid login credentials'));
    req.user = user;
    return next();
  })(req, res, next);
}

module.exports = { requireAuth, localLogin };
