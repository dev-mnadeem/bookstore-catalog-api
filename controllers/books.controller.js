'use strict';

const booksService = require('../services/books.service');
const { presentBook, presentBooks } = require('../utils/presenters');

/**
 * HTTP translation for books. Every handler does the same three things: read
 * the request, call one service function, present the result. No business rule
 * lives here.
 */

async function listBooks(req, res) {
  const page = await booksService.listPublished(req.validatedQuery || req.query);
  res.respond(200, { data: presentBooks(page.data), meta: page.meta });
}

async function getBookById(req, res) {
  const book = await booksService.getPublishedById(req.params.id);
  res.respond(200, { data: presentBook(book) });
}

async function listMyBooks(req, res) {
  const page = await booksService.listByAuthor(req.user.id, req.validatedQuery || req.query);
  res.respond(200, { data: presentBooks(page.data), meta: page.meta });
}

async function getMyBookById(req, res) {
  const book = await booksService.getOwnedBook(req.user.id, req.params.id);
  res.respond(200, { data: presentBook(book) });
}

async function createMyBook(req, res) {
  const book = await booksService.createBook(req.user, req.body);
  res.respond(201, { data: presentBook(book) });
}

async function updateMyBook(req, res) {
  const book = await booksService.updateBook(req.user, req.params.id, req.body);
  res.respond(200, { data: presentBook(book) });
}

async function unpublishMyBook(req, res) {
  const book = await booksService.unpublishBook(req.user, req.params.id);
  res.respond(200, { data: presentBook(book) });
}

module.exports = {
  listBooks,
  getBookById,
  listMyBooks,
  getMyBookById,
  createMyBook,
  updateMyBook,
  unpublishMyBook,
};
