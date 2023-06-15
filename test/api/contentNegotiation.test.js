'use strict';

const request = require('supertest');

const { app, registerAndLogin, createBook } = require('../helpers');

describe('content negotiation', () => {
  it('returns JSON by default', async () => {
    const response = await request(app).get('/api/books').expect(200);

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns XML when the request Content-Type asks for it', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, { title: 'Life Day Carols', status: 'published' });

    const response = await request(app)
      .get('/api/books')
      .set('Content-Type', 'application/xml')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/xml/);
    expect(response.text).toContain('<?xml version=');
    expect(response.text).toContain('<title>Life Day Carols</title>');
  });

  it('returns XML when the Accept header asks for it', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, { title: 'Bowcaster Care', status: 'published' });

    const response = await request(app).get('/api/books').set('Accept', 'text/xml').expect(200);

    expect(response.headers['content-type']).toMatch(/application\/xml/);
    expect(response.text).toContain('<title>Bowcaster Care</title>');
  });

  it('escapes content that would otherwise break the document', async () => {
    const author = await registerAndLogin();
    await createBook(author.authHeader, {
      title: 'Han & Chewie <the Falcon>',
      status: 'published',
    });

    const response = await request(app)
      .get('/api/books')
      .set('Accept', 'application/xml')
      .expect(200);

    // `&` and `<` must be escaped for the document to stay well-formed;
    // a bare `>` in character data is legal XML and is left alone.
    expect(response.text).toContain('Han &amp; Chewie &lt;the Falcon>');
    expect(response.text).not.toMatch(/<title>[^<]*&(?!amp;|lt;|gt;|quot;|apos;)/);
  });

  it('renders errors in XML too', async () => {
    const response = await request(app)
      .get('/api/books/64b7f0e2f1a2b3c4d5e6f701')
      .set('Accept', 'application/xml')
      .expect(404);

    expect(response.headers['content-type']).toMatch(/application\/xml/);
    expect(response.text).toContain('<status>404</status>');
  });
});
