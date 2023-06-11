'use strict';

const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { config } = require('../config/env');

const SALT_BYTES = 48;

function generateRandomSalt() {
  return crypto.randomBytes(SALT_BYTES).toString('hex');
}

function hashPassword(plainPassword, salt) {
  return bcrypt.hash(plainPassword + salt, config.bcryptRounds);
}

function verifyPassword(plainPassword, salt, passwordHash) {
  return bcrypt.compare(plainPassword + salt, passwordHash);
}

/**
 * Build the JWT for a user.
 *
 * Only non-sensitive claims are signed. The previous implementation spread a
 * whole mongoose document into the payload, which put the bcrypt password hash
 * and the per-user salt inside a token handed to the client — a JWT payload is
 * base64, not encrypted. The token is also given an expiry; it previously had
 * none and was valid forever.
 */
function generateToken(user) {
  const claims = {
    sub: String(user._id),
    username: user.username,
    authorPseudonym: user.authorPseudonym,
  };
  return jwt.sign(claims, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

module.exports = {
  generateRandomSalt,
  hashPassword,
  verifyPassword,
  generateToken,
};
