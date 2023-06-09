'use strict';

const User = require('../models/user.model');

/**
 * Data access for users.
 *
 * `password` and `salt` are `select: false` on the schema, so they are absent
 * from every read unless a query asks for them explicitly. Only
 * `findByUsernameWithSecret` does, and only the local login strategy calls it.
 */

function create(payload) {
  return User.create(payload);
}

function findById(userId) {
  return User.findById(userId).lean();
}

function findByUsernameWithSecret(username) {
  return User.findOne({ username }).select('+password +salt').lean();
}

function findConflict({ username, authorPseudonym }) {
  const clauses = [];
  if (username) clauses.push({ username });
  if (authorPseudonym) clauses.push({ authorPseudonym });
  if (clauses.length === 0) return Promise.resolve(null);
  return User.findOne({ $or: clauses }).lean();
}

function updateById(userId, payload) {
  return User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true }).lean();
}

function deleteById(userId) {
  return User.findByIdAndDelete(userId).lean();
}

module.exports = {
  create,
  findById,
  findByUsernameWithSecret,
  findConflict,
  updateById,
  deleteById,
};
