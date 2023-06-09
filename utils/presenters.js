'use strict';

const { toDecimal } = require('./money');

/**
 * Presenters are the single place that decides what a client is allowed to see.
 *
 * Controllers return presenter output and nothing else, so a field added to a
 * mongoose schema cannot leak into a response by accident — which is how the
 * original code ended up returning password hashes from some paths and not
 * others, depending on which `.select()` string the query happened to use.
 */

function presentUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    authorPseudonym: user.authorPseudonym,
    createdAt: user.createdAt,
  };
}

function presentBook(book) {
  if (!book) return null;
  return {
    id: String(book._id),
    title: book.title,
    description: book.description,
    author: book.authorPseudonym,
    authorId: String(book.author?._id ?? book.author),
    coverImageUrl: book.coverImageUrl,
    price: toDecimal(book.priceCents),
    currency: 'GCS',
    status: book.status,
  };
}

const presentBooks = (books) => books.map(presentBook);
const presentUsers = (users) => users.map(presentUser);

module.exports = { presentUser, presentUsers, presentBook, presentBooks };
