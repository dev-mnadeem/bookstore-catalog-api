'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');

const booksController = require('../controllers/books.controller');
const { validate } = require('../middleware/validate');
const { validateObjectId } = require('../middleware/objectId');
const { listBooksQuerySchema } = require('../schemas/book.schema');

/**
 * The public catalogue.
 *
 * The assignment is explicit: no authentication, GET only. Writes live on
 * /api/me/books, where the caller's identity decides what they may touch.
 */
const router = express.Router();

router.get('/', validate(listBooksQuerySchema, 'query'), asyncHandler(booksController.listBooks));
router.get('/:id', validateObjectId(), asyncHandler(booksController.getBookById));

module.exports = router;
