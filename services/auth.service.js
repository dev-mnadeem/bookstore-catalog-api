'use strict';

const usersDao = require('../dal/users.dao');
const authHelper = require('../utils/authHelper');

/**
 * Verify a username/password pair.
 *
 * The same message is returned whether the username is unknown or the password
 * is wrong, so the endpoint cannot be used to enumerate accounts.
 */
async function verifyCredentials(username, password) {
  const user = await usersDao.findByUsernameWithSecret(username);
  if (!user) return null;

  const matches = await authHelper.verifyPassword(password, user.salt, user.password);
  if (!matches) return null;

  const { password: _password, salt: _salt, ...safeUser } = user;
  return safeUser;
}

module.exports = { verifyCredentials };
