'use strict';

const usersDao = require('../dal/users.dao');
const booksDao = require('../dal/books.dao');
const AppError = require('../utils/AppError');
const authHelper = require('../utils/authHelper');

/**
 * Account business rules: uniqueness, credential hashing, and keeping the
 * denormalised author pseudonym on books in step with the account.
 */

async function register({ name, username, authorPseudonym, password }) {
  const conflict = await usersDao.findConflict({ username, authorPseudonym });
  if (conflict) {
    const field = conflict.username === username ? 'username' : 'authorPseudonym';
    throw AppError.conflict(`That ${field} is already taken`, { field });
  }

  const salt = authHelper.generateRandomSalt();
  const passwordHash = await authHelper.hashPassword(password, salt);

  const created = await usersDao.create({
    name,
    username,
    authorPseudonym,
    salt,
    password: passwordHash,
  });

  return usersDao.findById(created._id);
}

async function getById(userId) {
  const user = await usersDao.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  return user;
}

async function updateProfile(userId, changes) {
  const current = await getById(userId);

  const patch = {};
  if (changes.name !== undefined) patch.name = changes.name;

  if (
    changes.authorPseudonym !== undefined &&
    changes.authorPseudonym !== current.authorPseudonym
  ) {
    const conflict = await usersDao.findConflict({ authorPseudonym: changes.authorPseudonym });
    if (conflict && String(conflict._id) !== String(userId)) {
      throw AppError.conflict('That authorPseudonym is already taken', {
        field: 'authorPseudonym',
      });
    }
    patch.authorPseudonym = changes.authorPseudonym;
  }

  if (changes.password !== undefined) {
    const salt = authHelper.generateRandomSalt();
    patch.salt = salt;
    patch.password = await authHelper.hashPassword(changes.password, salt);
  }

  if (Object.keys(patch).length === 0) return current;

  const updated = await usersDao.updateById(userId, patch);

  // Books carry a copy of the pen name for the catalogue; keep it truthful.
  if (patch.authorPseudonym) {
    await booksDao.updateAuthorPseudonym(userId, patch.authorPseudonym);
  }

  return updated;
}

/** Closing an account also removes that author's catalogue. */
async function deleteAccount(userId) {
  const user = await getById(userId);
  await booksDao.deleteByAuthor(userId);
  await usersDao.deleteById(userId);
  return user;
}

module.exports = { register, getById, updateProfile, deleteAccount };
