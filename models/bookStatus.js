'use strict';

/** The lifecycle states a book can be in. */
const BOOK_STATUSES = Object.freeze({
  PUBLISHED: 'published',
  DRAFT: 'draft',
});

const BOOK_STATUS_VALUES = Object.freeze(Object.values(BOOK_STATUSES));

module.exports = { BOOK_STATUSES, BOOK_STATUS_VALUES };
