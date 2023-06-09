'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const { config } = require('./env');
const authService = require('../services/auth.service');
const usersDao = require('../dal/users.dao');

/**
 * Passport strategy wiring.
 *
 * `local` is used by POST /api/auth/login only. `jwt` guards the authenticated
 * routes. Both delegate to the service layer; neither contains business logic.
 */

const localStrategy = new LocalStrategy(
  { usernameField: 'username' },
  (username, password, done) => {
    authService
      .verifyCredentials(username, password)
      .then((user) =>
        done(null, user || false, user ? undefined : { message: 'Invalid login credentials' })
      )
      .catch(done);
  }
);

/**
 * The JWT payload is a claim, not a user record. It is re-read from the
 * database on every request so that a token issued before an account was
 * deleted or renamed stops working immediately. The original implementation
 * trusted the token payload as the user object, which meant a deleted account's
 * token stayed valid until it expired — and it never expired.
 */
const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwt.secret,
  },
  (payload, done) => {
    if (!payload?.sub) return done(null, false);
    usersDao
      .findById(payload.sub)
      .then((user) => done(null, user ? { ...user, id: String(user._id) } : false))
      .catch(() => done(null, false));
  }
);

passport.use('local', localStrategy);
passport.use('jwt', jwtStrategy);

module.exports = passport;
