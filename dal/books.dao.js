'use strict';

const Book = require('../models/book.model');

/**
 * Data access for books. Everything that talks to mongoose for the Book
 * collection lives here; services above never build a query themselves.
 */

function create(payload) {
  return Book.create(payload);
}

/**
 * Page through books matching `filter`.
 *
 * `countDocuments` and `find` are issued together rather than in sequence, and
 * `.lean()` skips mongoose document hydration — the catalogue is read-only, so
 * there is nothing to gain from full documents.
 */
async function findPage({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } }) {
  const [items, total] = await Promise.all([
    Book.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Book.countDocuments(filter),
  ]);
  return { items, total };
}

function findById(bookId) {
  return Book.findById(bookId).lean();
}

function findOne(filter) {
  return Book.findOne(filter).lean();
}

function updateById(bookId, payload) {
  return Book.findByIdAndUpdate(bookId, payload, { new: true, runValidators: true }).lean();
}

function deleteById(bookId) {
  return Book.findByIdAndDelete(bookId).lean();
}

function updateAuthorPseudonym(authorId, authorPseudonym) {
  return Book.updateMany({ author: authorId }, { $set: { authorPseudonym } });
}

function deleteByAuthor(authorId) {
  return Book.deleteMany({ author: authorId });
}

module.exports = {
  create,
  findPage,
  findById,
  findOne,
  updateById,
  deleteById,
  updateAuthorPseudonym,
  deleteByAuthor,
};
