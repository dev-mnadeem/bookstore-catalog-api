'use strict';

process.env.ENVIRONMENT = 'test';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'test-only-signing-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
// bcrypt cost dominates the runtime of an auth-heavy suite; 4 is the minimum
// bcryptjs accepts and keeps the hashing code path identical.
process.env.BCRYPT_ROUNDS = '4';

const mongoose = require('mongoose');

const Book = require('../models/book.model');
const User = require('../models/user.model');

jest.setTimeout(30000);

beforeAll(async () => {
  const uri = `${process.env.MONGO_TEST_URI}jest-${process.env.JEST_WORKER_ID || '1'}`;
  await mongoose.connect(uri);
  // Build the declared indexes so index-backed queries (`$text`) behave as they
  // would in production rather than silently erroring.
  await Promise.all([Book.init(), User.init()]);
});

afterEach(async () => {
  await Promise.all([Book.deleteMany({}), User.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
