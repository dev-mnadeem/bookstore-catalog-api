'use strict';

const usersService = require('../services/users.service');
const authHelper = require('../utils/authHelper');
const { presentUser } = require('../utils/presenters');

/** HTTP translation for accounts and authentication. */

async function register(req, res) {
  const user = await usersService.register(req.body);
  res.respond(201, { data: presentUser(user) });
}

/**
 * The local strategy has already verified the credentials and put the user on
 * the request, so this only has to mint the token.
 */
async function login(req, res) {
  const token = authHelper.generateToken(req.user);
  res.respond(200, { data: { jwt: token, user: presentUser(req.user) } });
}

async function getMe(req, res) {
  const user = await usersService.getById(req.user.id);
  res.respond(200, { data: presentUser(user) });
}

async function updateMe(req, res) {
  const user = await usersService.updateProfile(req.user.id, req.body);
  res.respond(200, { data: presentUser(user) });
}

async function deleteMe(req, res) {
  await usersService.deleteAccount(req.user.id);
  res.respond(204, null);
}

module.exports = { register, login, getMe, updateMe, deleteMe };
