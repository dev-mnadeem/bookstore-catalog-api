'use strict';

const request = require('supertest');

const app = require('../app');

const DEFAULT_PASSWORD = 'correct-horse-battery';

let counter = 0;

function uniqueSuffix() {
  counter += 1;
  return `${Date.now().toString(36)}${counter}`;
}

function buildUser(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    name: `Wookie ${suffix}`,
    username: `wookie_${suffix}`,
    authorPseudonym: `Pseudonym ${suffix}`,
    password: DEFAULT_PASSWORD,
    ...overrides,
  };
}

function buildBook(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    title: `The Adventures of ${suffix}`,
    description: 'A rousing tale from the forests of Kashyyyk.',
    coverImageUrl: 'https://example.test/cover.png',
    price: 12.99,
    ...overrides,
  };
}

/** Register an account and return it together with a bearer token. */
async function registerAndLogin(overrides = {}) {
  const payload = buildUser(overrides);

  const registered = await request(app).post('/api/users').send(payload).expect(201);

  const loggedIn = await request(app)
    .post('/api/auth/login')
    .send({ username: payload.username, password: payload.password })
    .expect(200);

  return {
    credentials: payload,
    user: registered.body.data,
    token: loggedIn.body.data.jwt,
    authHeader: `Bearer ${loggedIn.body.data.jwt}`,
  };
}

/** Create a book for an authenticated author. */
async function createBook(authHeader, overrides = {}) {
  const response = await request(app)
    .post('/api/me/books')
    .set('Authorization', authHeader)
    .send(buildBook(overrides))
    .expect(201);
  return response.body.data;
}

module.exports = { app, buildUser, buildBook, registerAndLogin, createBook, DEFAULT_PASSWORD };
