'use strict';

const Joi = require('joi');

const name = Joi.string().trim().min(1).max(40);
const username = Joi.string().trim().min(3).max(40);
const authorPseudonym = Joi.string().trim().min(2).max(60);
const password = Joi.string().min(8).max(128);

const registerSchema = Joi.object({
  name: name.required(),
  username: username.required(),
  authorPseudonym: authorPseudonym.required(),
  password: password.required(),
});

const updateProfileSchema = Joi.object({
  name,
  authorPseudonym,
  password,
})
  .min(1)
  .messages({ 'object.min': 'Provide at least one of: name, authorPseudonym, password' });

const loginSchema = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, updateProfileSchema, loginSchema };
