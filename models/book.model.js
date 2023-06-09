'use strict';

const mongoose = require('mongoose');

const { BOOK_STATUSES, BOOK_STATUS_VALUES } = require('./bookStatus');

/**
 * A book offered on Wookie Books.
 *
 * Price is stored in whole cents as an integer. Storing money as a JS float
 * loses precision (0.1 + 0.2 !== 0.3); the API still presents a decimal amount.
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /**
     * Denormalised copy of the author's pen name at publication time.
     * The public catalogue is read far more often than it is written, and a
     * pseudonym is what the listing displays, so carrying it on the book keeps
     * `GET /api/books` from having to join the users collection at all.
     */
    authorPseudonym: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: BOOK_STATUS_VALUES,
      default: BOOK_STATUSES.DRAFT,
      index: true,
    },
    coverImageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

// Supports the default catalogue query: published books, newest first.
bookSchema.index({ status: 1, createdAt: -1 });
// Supports `?search=` across title and description.
bookSchema.index({ title: 'text', description: 'text' });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
