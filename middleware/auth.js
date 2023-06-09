'use strict';

const passport = require('../config/passport');
const AppError = require('../utils/AppError');

/**
 * Route-level authentication.
 *
 * The original code installed a single global middleware that tried to work out
 * which strategy to apply by string-matching `req.originalUrl` against two hard
 * coded lists, using a regular expression that looked for 21-character ids —
 * MongoDB ObjectIds are 24 hex characters, so that branch never fired. Any
 * route not on the lists silently required a JWT, which is why the public
 * catalogue the assignment asks for was behind authentication.
 *
 * Declaring the requirement on the route it applies to removes the guesswork:
 * a reader can see, from routes/books.js alone, that the catalogue is public.
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
