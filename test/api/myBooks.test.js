'use strict';

const request = require('supertest');

const { app, buildBook, registerAndLogin, createBook } = require('../helpers');

describe('/api/me/books', () => {
  it('requires authentication for every verb', async () => {
    await request(app).get('/api/me/books').expect(401);
    await request(app).post('/api/me/books').send(buildBook()).expect(401);
    await request(app).get('/api/me/books/64b7f0e2f1a2b3c4d5e6f701').expect(401);
    await request(app).put('/api/me/books/64b7f0e2f1a2b3c4d5e6f701').send({}).expect(401);
    await request(app).delete('/api/me/books/64b7f0e2f1a2b3c4d5e6f701').expect(401);
  });

  it('creates a book attributed to the caller pseudonym', async () => {
    const author = await registerAndLogin({ authorPseudonym: 'Lohgarra of Kashyyyk' });

    const response = await request(app)
      .post('/api/me/books')
      .set('Authorization', author.authHeader)
      .send(buildBook({ title: 'Medical Supplies for Endor', price: 8.5 }))
      .expect(201);

    expect(response.body.data).toMatchObject({
      title: 'Medical Supplies for Endor',
      author: 'Lohgarra of Kashyyyk',
      authorId: author.user.id,
      price: 8.5,
      status: 'draft',
    });
  });

  it('defaults a new book to draft', async () => {
    const author = await registerAndLogin();
    const book = await createBook(author.authHeader);

    expect(book.status).toBe('draft');
    await request(app).get(`/api/books/${book.id}`).expect(404);
  });

  it('rejects an invalid book payload', async () => {
    const author = await registerAndLogin();

    const response = await request(app)
      .post('/api/me/books')
      .set('Authorization', author.authHeader)
      .send({ title: '', price: -5, coverImageUrl: 'not-a-url' })
      .expect(400);

    const fields = response.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'price', 'coverImageUrl']));
  });

  it('lists only the caller own books, drafts included', async () => {
    const lohgarra = await registerAndLogin();
    const chewie = await registerAndLogin();
    await createBook(lohgarra.authHeader, { title: 'Mine (draft)' });
    await createBook(lohgarra.authHeader, { title: 'Mine (published)', status: 'published' });
    await createBook(chewie.authHeader, { title: 'Not mine', status: 'published' });

    const response = await request(app)
      .get('/api/me/books')
      .set('Authorization', lohgarra.authHeader)
      .expect(200);

    expect(response.body.data.map((b) => b.title).sort()).toEqual([
      'Mine (draft)',
      'Mine (published)',
    ]);
  });

  it('filters the author shelf by status', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, { title: 'A', status: 'draft' });
    await createBook(author.authHeader, { title: 'B', status: 'published' });

    const response = await request(app)
      .get('/api/me/books?status=published')
      .set('Authorization', author.authHeader)
      .expect(200);

    expect(response.body.data.map((b) => b.title)).toEqual(['B']);
  });

  it('updates a book the caller owns', async () => {
    const author = await registerAndLogin();
    const book = await createBook(author.authHeader);

    const response = await request(app)
      .put(`/api/me/books/${book.id}`)
      .set('Authorization', author.authHeader)
      .send({ title: 'A Revised Title', price: 20 })
      .expect(200);

    expect(response.body.data).toMatchObject({ title: 'A Revised Title', price: 20 });
  });

  it('refuses to read, update or unpublish somebody else book', async () => {
    const lohgarra = await registerAndLogin();
    const vaderless = await registerAndLogin();
    const book = await createBook(lohgarra.authHeader, { status: 'published' });

    await request(app)
      .get(`/api/me/books/${book.id}`)
      .set('Authorization', vaderless.authHeader)
      .expect(404);

    await request(app)
      .put(`/api/me/books/${book.id}`)
      .set('Authorization', vaderless.authHeader)
      .send({ title: 'Hijacked' })
      .expect(404);

    await request(app)
      .delete(`/api/me/books/${book.id}`)
      .set('Authorization', vaderless.authHeader)
      .expect(404);

    const stillThere = await request(app).get(`/api/books/${book.id}`).expect(200);
    expect(stillThere.body.data.status).toBe('published');
  });

  it('unpublishes on DELETE, withdrawing the listing but keeping the manuscript', async () => {
    const author = await registerAndLogin();
    const book = await createBook(author.authHeader, { status: 'published' });

    await request(app).get(`/api/books/${book.id}`).expect(200);

    const response = await request(app)
      .delete(`/api/me/books/${book.id}`)
      .set('Authorization', author.authHeader)
      .expect(200);

    expect(response.body.data.status).toBe('draft');
    await request(app).get(`/api/books/${book.id}`).expect(404);

    const shelf = await request(app)
      .get('/api/me/books')
      .set('Authorization', author.authHeader)
      .expect(200);
    expect(shelf.body.data.map((b) => b.id)).toContain(book.id);
  });

  it('returns 404 for a book id that does not exist', async () => {
    const author = await registerAndLogin();

    await request(app)
      .get('/api/me/books/64b7f0e2f1a2b3c4d5e6f701')
      .set('Authorization', author.authHeader)
      .expect(404);
  });
});

describe('publishing policy', () => {
  it('stops Darth Vader publishing on Wookie Books', async () => {
    const vader = await registerAndLogin({ authorPseudonym: 'Darth Vader' });

    const response = await request(app)
      .post('/api/me/books')
      .set('Authorization', vader.authHeader)
      .send(buildBook({ status: 'published' }))
      .expect(403);

    expect(response.body.error.message).toMatch(/Darth Vader/);

    const catalogue = await request(app).get('/api/books').expect(200);
    expect(catalogue.body.data).toHaveLength(0);
  });

  it('stops Darth Vader publishing a draft he already owns', async () => {
    const vader = await registerAndLogin({ authorPseudonym: '  darth   vader  ' });
    const book = await createBook(vader.authHeader, { status: 'draft' });

    await request(app)
      .put(`/api/me/books/${book.id}`)
      .set('Authorization', vader.authHeader)
      .send({ status: 'published' })
      .expect(403);
  });

  it('lets everybody else publish', async () => {
    const author = await registerAndLogin({ authorPseudonym: 'Lohgarra' });

    await request(app)
      .post('/api/me/books')
      .set('Authorization', author.authHeader)
      .send(buildBook({ status: 'published' }))
      .expect(201);
  });
});
