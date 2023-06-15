'use strict';

const request = require('supertest');

const { app, registerAndLogin, createBook } = require('../helpers');

describe('GET /api/books (public catalogue)', () => {
  it('is readable without authentication', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, { title: 'Life Day', status: 'published' });

    const response = await request(app).get('/api/books').expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe('Life Day');
  });

  it('hides drafts from the public catalogue', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, { title: 'Published Tale', status: 'published' });
    await createBook(author.authHeader, { title: 'Secret Draft', status: 'draft' });

    const response = await request(app).get('/api/books').expect(200);

    expect(response.body.data.map((book) => book.title)).toEqual(['Published Tale']);
  });

  it('paginates and reports totals', async () => {
    const author = await registerAndLogin();
    for (let i = 0; i < 5; i += 1) {
      await createBook(author.authHeader, { title: `Volume ${i}`, status: 'published' });
    }

    const response = await request(app).get('/api/books?page=2&limit=2').expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toMatchObject({ page: 2, limit: 2, total: 5, totalPages: 3 });
    expect(response.body.meta.hasNextPage).toBe(true);
  });

  it('clamps an oversized limit instead of returning the whole collection', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, { status: 'published' });

    const response = await request(app).get('/api/books?limit=100000').expect(200);

    expect(response.body.meta.limit).toBe(100);
  });

  it('filters by title', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, { title: 'Wookie Cookbook', status: 'published' });
    await createBook(author.authHeader, { title: 'Ewok Almanac', status: 'published' });

    const response = await request(app).get('/api/books?title=wookie').expect(200);

    expect(response.body.data.map((b) => b.title)).toEqual(['Wookie Cookbook']);
  });

  it('filters by author pseudonym', async () => {
    const lohgarra = await registerAndLogin({ authorPseudonym: 'Lohgarra' });
    const chewie = await registerAndLogin({ authorPseudonym: 'Chewbacca' });
    await createBook(lohgarra.authHeader, { title: 'Kashyyyk Nights', status: 'published' });
    await createBook(chewie.authHeader, { title: 'Falcon Repairs', status: 'published' });

    const response = await request(app).get('/api/books?author=Lohgarra').expect(200);

    expect(response.body.data.map((b) => b.author)).toEqual(['Lohgarra']);
  });

  it('full-text searches title and description', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, {
      title: 'Bowcaster Maintenance',
      description: 'Keeping a bowcaster in working order.',
      status: 'published',
    });
    await createBook(author.authHeader, {
      title: 'Cooking With Porgs',
      description: 'Recipes from Ahch-To.',
      status: 'published',
    });

    const response = await request(app).get('/api/books?search=bowcaster').expect(200);

    expect(response.body.data.map((b) => b.title)).toEqual(['Bowcaster Maintenance']);
  });

  it('filters by price range and sorts by price', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, { title: 'Cheap', price: 1.5, status: 'published' });
    await createBook(author.authHeader, { title: 'Mid', price: 10, status: 'published' });
    await createBook(author.authHeader, { title: 'Dear', price: 99.95, status: 'published' });

    const range = await request(app).get('/api/books?minPrice=2&maxPrice=50').expect(200);
    expect(range.body.data.map((b) => b.title)).toEqual(['Mid']);

    const sorted = await request(app).get('/api/books?sort=price_desc').expect(200);
    expect(sorted.body.data.map((b) => b.title)).toEqual(['Dear', 'Mid', 'Cheap']);
  });

  it('rejects an unknown query parameter', async () => {
    const response = await request(app).get('/api/books?sort=cheapest').expect(400);

    expect(response.body.error.details.map((d) => d.field)).toContain('sort');
  });

  it('returns prices as decimals, not cents', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, { price: 12.99, status: 'published' });

    const response = await request(app).get('/api/books').expect(200);

    expect(response.body.data[0].price).toBe(12.99);
  });

  it('does not accept writes on the public resource', async () => {
    await request(app).post('/api/books').send({}).expect(404);
    await request(app).delete('/api/books/64b7f0e2f1a2b3c4d5e6f701').expect(404);
  });
});

describe('GET /api/books/:id', () => {
  it('returns a published book without authentication', async () => {
    const author = await registerAndLogin();
    const book = await createBook(author.authHeader, { status: 'published' });

    const response = await request(app).get(`/api/books/${book.id}`).expect(200);

    expect(response.body.data.id).toBe(book.id);
  });

  it('returns 404 for a draft', async () => {
    const author = await registerAndLogin();
    const book = await createBook(author.authHeader, { status: 'draft' });

    await request(app).get(`/api/books/${book.id}`).expect(404);
  });

  it('returns 404 for a well-formed id that does not exist', async () => {
    const response = await request(app).get('/api/books/64b7f0e2f1a2b3c4d5e6f701').expect(404);

    expect(response.body.error.status).toBe(404);
  });

  it('returns 404 rather than 500 for a malformed id', async () => {
    await request(app).get('/api/books/not-an-object-id').expect(404);
  });
});
