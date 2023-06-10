'use strict';

const Joi = require('joi');

const { BOOK_STATUS_VALUES } = require('../models/bookStatus');

const title = Joi.string().trim().min(1).max(120);
const description = Joi.string().trim().min(1).max(2000);
const coverImageUrl = Joi.string()
  .trim()
  .uri({ scheme: ['http', 'https'] })
  .max(2048);
const price = Joi.number().min(0).max(1_000_000).precision(2);
const status = Joi.string().valid(...BOOK_STATUS_VALUES);

const createBookSchema = Joi.object({
  title: title.required(),
  description: description.required(),
  coverImageUrl: coverImageUrl.required(),
  price: price.required(),
  status: status.default('draft'),
});

const updateBookSchema = Joi.object({
  title,
  description,
  coverImageUrl,
  price,
  status,
})
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update' });

/** Query parameters accepted by the catalogue listing. */
const listBooksQuerySchema = Joi.object({
  search: Joi.string().trim().max(200),
  title: Joi.string().trim().max(120),
  author: Joi.string().trim().max(60),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  sort: Joi.string().valid('newest', 'oldest', 'price_asc', 'price_desc', 'title'),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1),
}).unknown(false);

const listMyBooksQuerySchema = listBooksQuerySchema.keys({
  status,
});

module.exports = {
  createBookSchema,
  updateBookSchema,
  listBooksQuerySchema,
  listMyBooksQuerySchema,
};
