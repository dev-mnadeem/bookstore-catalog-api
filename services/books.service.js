'use strict';

const booksDao = require('../dal/books.dao');
const { BOOK_STATUSES } = require('../models/bookStatus');
const publishingPolicy = require('./publishingPolicy');
const AppError = require('../utils/AppError');
const { toCents } = require('../utils/money');
const { parsePagination, buildPage } = require('../utils/pagination');

/**
 * Book business rules: catalogue visibility, search, ownership and the
 * editorial policy that gates publishing.
 *
 * Controllers do not know any of this; they translate HTTP to a call here and
 * a presenter back. Nothing in this file imports express.
 */

const SORTS = Object.freeze({
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { priceCents: 1 },
  price_desc: { priceCents: -1 },
  title: { title: 1 },
});

/** Escape user input before it becomes part of a RegExp. */
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchFilter(query = {}) {
  const filter = {};

  if (query.search) {
    filter.$text = { $search: String(query.search) };
  }
  if (query.title) {
    filter.title = { $regex: escapeRegExp(query.title), $options: 'i' };
  }
  if (query.author) {
    filter.authorPseudonym = { $regex: escapeRegExp(query.author), $options: 'i' };
  }

  const min = Number.parseFloat(query.minPrice);
  const max = Number.parseFloat(query.maxPrice);
  if (Number.isFinite(min) || Number.isFinite(max)) {
    filter.priceCents = {};
    if (Number.isFinite(min)) filter.priceCents.$gte = toCents(min);
    if (Number.isFinite(max)) filter.priceCents.$lte = toCents(max);
  }

  return filter;
}

function resolveSort(query = {}) {
  return SORTS[query.sort] || SORTS.newest;
}

/** The public catalogue: published books only, never anyone's drafts. */
async function listPublished(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { ...buildSearchFilter(query), status: BOOK_STATUSES.PUBLISHED };
  const { items, total } = await booksDao.findPage({
    filter,
    skip,
    limit,
    sort: resolveSort(query),
  });
  return buildPage({ items, total, page, limit });
}

async function getPublishedById(bookId) {
  const book = await booksDao.findOne({ _id: bookId, status: BOOK_STATUSES.PUBLISHED });
  if (!book) throw AppError.notFound('Book not found');
  return book;
}

/** An author's own shelf, drafts included. */
async function listByAuthor(authorId, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { ...buildSearchFilter(query), author: authorId };
  if (query.status) filter.status = String(query.status);
  const { items, total } = await booksDao.findPage({
    filter,
    skip,
    limit,
    sort: resolveSort(query),
  });
  return buildPage({ items, total, page, limit });
}

/**
 * Load a book the caller owns.
 * A book belonging to somebody else is reported as 404, not 403, so the
 * endpoint does not confirm that an id exists to a caller with no claim on it.
 */
async function getOwnedBook(authorId, bookId) {
  const book = await booksDao.findById(bookId);
  if (!book || String(book.author) !== String(authorId)) {
    throw AppError.notFound('Book not found');
  }
  return book;
}

function assertPublishingAllowed(user, book) {
  if (book.status !== BOOK_STATUSES.PUBLISHED) return;
  const reasons = publishingPolicy.evaluate({ user, book });
  if (reasons.length > 0) {
    throw AppError.forbidden(reasons[0], { reasons });
  }
}

async function createBook(user, payload) {
  const book = {
    title: payload.title,
    description: payload.description,
    coverImageUrl: payload.coverImageUrl,
    priceCents: toCents(payload.price),
    status: payload.status || BOOK_STATUSES.DRAFT,
    author: user.id,
    authorPseudonym: user.authorPseudonym,
  };

  assertPublishingAllowed(user, book);
  return booksDao.create(book);
}

async function updateBook(user, bookId, payload) {
  const existing = await getOwnedBook(user.id, bookId);

  const patch = {};
  for (const field of ['title', 'description', 'coverImageUrl', 'status']) {
    if (payload[field] !== undefined) patch[field] = payload[field];
  }
  if (payload.price !== undefined) patch.priceCents = toCents(payload.price);

  assertPublishingAllowed(user, { ...existing, ...patch });

  return booksDao.updateById(bookId, patch);
}

/**
 * Take a book off sale.
 *
 * The assignment asks for "an endpoint to unpublish a book (DELETE)", so DELETE
 * on an author's book withdraws the listing rather than destroying the record —
 * an author who unpublishes by accident has not lost their manuscript, and
 * anything that ever referenced the book still resolves.
 */
async function unpublishBook(user, bookId) {
  await getOwnedBook(user.id, bookId);
  return booksDao.updateById(bookId, { status: BOOK_STATUSES.DRAFT });
}

module.exports = {
  listPublished,
  getPublishedById,
  listByAuthor,
  getOwnedBook,
  createBook,
  updateBook,
  unpublishBook,
  buildSearchFilter,
  SORTS,
};
