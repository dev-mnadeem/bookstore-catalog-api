'use strict';

const { config } = require('../config/env');

/**
 * Turn `?page=&limit=` into a bounded skip/limit pair.
 *
 * Collection endpoints must never run an unbounded `find()`: a single request
 * for a large collection would otherwise pull every document into memory.
 * `limit` is clamped to PAGE_SIZE_MAX no matter what the caller asks for.
 */
function parsePagination(query = {}) {
  const { defaultLimit, maxLimit } = config.pagination;

  const requestedPage = Number.parseInt(query.page, 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedLimit = Number.parseInt(query.limit, 10);
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, maxLimit)
      : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}

function buildPage({ items, total, page, limit }) {
  return {
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      hasNextPage: page * limit < total,
    },
  };
}

module.exports = { parsePagination, buildPage };
