'use strict';

const { translateError } = require('../../middleware/errorHandler');
const AppError = require('../../utils/AppError');

describe('translateError', () => {
  it('passes an AppError through untouched', () => {
    const error = AppError.notFound('Book not found');
    expect(translateError(error)).toBe(error);
  });

  it('turns a duplicate-key race into the 409 the pre-check would have given', () => {
    const duplicate = Object.assign(new Error('E11000 duplicate key error'), {
      code: 11000,
      keyPattern: { username: 1 },
      keyValue: { username: 'lohgarra' },
    });

    const translated = translateError(duplicate);

    expect(translated.status).toBe(409);
    expect(translated.message).toBe('That username is already taken');
    expect(translated.details).toEqual({ field: 'username' });
  });

  it('refuses to describe an unexpected fault', () => {
    expect(translateError(new Error('connection string leaked here'))).toBeNull();
  });
});
