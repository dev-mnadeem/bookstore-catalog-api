'use strict';

const request = require('supertest');

const { app, registerAndLogin, createBook } = require('../helpers');

describe('/api/me (authenticated user resource)', () => {
  it('returns the caller profile', async () => {
    const author = await registerAndLogin();

    const response = await request(app)
      .get('/api/me')
      .set('Authorization', author.authHeader)
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: author.user.id,
      username: author.credentials.username,
    });
    expect(response.body.data).not.toHaveProperty('password');
  });

  it('updates the profile name', async () => {
    const author = await registerAndLogin();

    const response = await request(app)
      .put('/api/me')
      .set('Authorization', author.authHeader)
      .send({ name: 'Lohgarra the Elder' })
      .expect(200);

    expect(response.body.data.name).toBe('Lohgarra the Elder');
  });

  it('rewrites the pseudonym on the author existing books', async () => {
    const author = await registerAndLogin({ authorPseudonym: 'Old Pen Name' });
    await createBook(author.authHeader, { status: 'published' });

    await request(app)
      .put('/api/me')
      .set('Authorization', author.authHeader)
      .send({ authorPseudonym: 'New Pen Name' })
      .expect(200);

    const catalogue = await request(app).get('/api/books').expect(200);
    expect(catalogue.body.data[0].author).toBe('New Pen Name');
  });

  it('refuses a pseudonym another author already uses', async () => {
    const taken = await registerAndLogin({ authorPseudonym: 'Chewbacca' });
    const author = await registerAndLogin();

    const response = await request(app)
      .put('/api/me')
      .set('Authorization', author.authHeader)
      .send({ authorPseudonym: taken.credentials.authorPseudonym })
      .expect(409);

    expect(response.body.error.details.field).toBe('authorPseudonym');
  });

  it('rejects an empty update body', async () => {
    const author = await registerAndLogin();

    await request(app).put('/api/me').set('Authorization', author.authHeader).send({}).expect(400);
  });

  it('lets the caller change their password and log in with the new one', async () => {
    const author = await registerAndLogin();

    await request(app)
      .put('/api/me')
      .set('Authorization', author.authHeader)
      .send({ password: 'a-brand-new-password' })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ username: author.credentials.username, password: author.credentials.password })
      .expect(401);

    await request(app)
      .post('/api/auth/login')
      .send({ username: author.credentials.username, password: 'a-brand-new-password' })
      .expect(200);
  });

  it('deletes the account and removes its books from the catalogue', async () => {
    const author = await registerAndLogin();
    const book = await createBook(author.authHeader, { status: 'published' });

    await request(app).get(`/api/books/${book.id}`).expect(200);

    await request(app).delete('/api/me').set('Authorization', author.authHeader).expect(204);

    await request(app).get(`/api/books/${book.id}`).expect(404);
  });

  it('cannot be used to reach another account by id', async () => {
    const victim = await registerAndLogin();
    const attacker = await registerAndLogin();

    await request(app)
      .delete(`/api/users/${victim.user.id}`)
      .set('Authorization', attacker.authHeader)
      .expect(404);

    await request(app).get('/api/users').set('Authorization', attacker.authHeader).expect(404);

    await request(app).get('/api/me').set('Authorization', victim.authHeader).expect(200);
  });
});

describe('unmatched routes', () => {
  it('answers 404 with a structured error', async () => {
    const response = await request(app).get('/api/nowhere').expect(404);

    expect(response.body.error).toMatchObject({ status: 404 });
  });
});

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body.data.status).toBe('ok');
  });
});
