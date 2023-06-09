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

  it('keeps the status of a client error the body parser raised', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), {
      status: 413,
      expose: true,
      type: 'entity.too.large',
    });

    const translated = translateError(tooLarge);

    expect(translated).toBeInstanceOf(AppError);
    expect(translated.status).toBe(413);
  });

  it('does not trust an exposed error that claims to be a server fault', () => {
    expect(
      translateError(Object.assign(new Error('boom'), { status: 503, expose: true }))
    ).toBeNull();
  });

  it('refuses to describe an unexpected fault', () => {
    expect(translateError(new Error('connection string leaked here'))).toBeNull();
  });
});
