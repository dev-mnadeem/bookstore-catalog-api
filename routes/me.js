'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');

const booksController = require('../controllers/books.controller');
const usersController = require('../controllers/users.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { validateObjectId } = require('../middleware/objectId');
const { updateProfileSchema } = require('../schemas/user.schema');
const {
  createBookSchema,
  updateBookSchema,
  listMyBooksQuerySchema,
} = require('../schemas/book.schema');

/**
 * Everything the authenticated user owns.
 *
 * `requireAuth` is applied once for the whole router, so a route added below
 * cannot accidentally be left public, and `req.user.id` is the only source of
 * ownership — a caller can never name someone else's account in the path.
 */
const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(usersController.getMe));
router.put('/', validate(updateProfileSchema), asyncHandler(usersController.updateMe));
router.delete('/', asyncHandler(usersController.deleteMe));

router.get(
  '/books',
  validate(listMyBooksQuerySchema, 'query'),
  asyncHandler(booksController.listMyBooks)
);
router.post('/books', validate(createBookSchema), asyncHandler(booksController.createMyBook));
router.get('/books/:id', validateObjectId(), asyncHandler(booksController.getMyBookById));
router.put(
  '/books/:id',
  validateObjectId(),
  validate(updateBookSchema),
  asyncHandler(booksController.updateMyBook)
);
// DELETE unpublishes: the assignment asks for an unpublish endpoint on DELETE.
router.delete('/books/:id', validateObjectId(), asyncHandler(booksController.unpublishMyBook));

module.exports = router;
