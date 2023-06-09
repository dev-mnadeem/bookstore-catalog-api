'use strict';

const jwt = require('jsonwebtoken');
const request = require('supertest');

const { app, buildUser, registerAndLogin, DEFAULT_PASSWORD } = require('../helpers');

describe('POST /api/users (registration)', () => {
  it('creates an account and never returns the credentials', async () => {
    const payload = buildUser();

    const response = await request(app).post('/api/users').send(payload).expect(201);

    expect(response.body.data).toMatchObject({
      name: payload.name,
      username: payload.username,
      authorPseudonym: payload.authorPseudonym,
    });
    expect(response.body.data).not.toHaveProperty('password');
    expect(response.body.data).not.toHaveProperty('salt');
    expect(JSON.stringify(response.body)).not.toContain(payload.password);
  });

  it('rejects a payload missing the author pseudonym', async () => {
    const { authorPseudonym: _omitted, ...payload } = buildUser();

    const response = await request(app).post('/api/users').send(payload).expect(400);

    expect(response.body.error.message).toBe('Request validation failed');
    expect(response.body.error.details.map((d) => d.field)).toContain('authorPseudonym');
  });

  it('rejects a short password', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(buildUser({ password: 'short' }))
      .expect(400);

    expect(response.body.error.details.map((d) => d.field)).toContain('password');
  });

  it('refuses a duplicate username', async () => {
    const payload = buildUser();
    await request(app).post('/api/users').send(payload).expect(201);

    const response = await request(app)
      .post('/api/users')
      .send(buildUser({ username: payload.username }))
      .expect(409);

    expect(response.body.error.details.field).toBe('username');
  });

  it('refuses a duplicate author pseudonym', async () => {
    const payload = buildUser();
    await request(app).post('/api/users').send(payload).expect(201);

    const response = await request(app)
      .post('/api/users')
      .send(buildUser({ authorPseudonym: payload.authorPseudonym }))
      .expect(409);

    expect(response.body.error.details.field).toBe('authorPseudonym');
  });
});

describe('POST /api/auth/login', () => {
  it('returns a JWT for valid credentials', async () => {
    const payload = buildUser();
    await request(app).post('/api/users').send(payload).expect(201);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: payload.username, password: payload.password })
      .expect(200);

    expect(typeof response.body.data.jwt).toBe('string');
    expect(response.body.data.user.username).toBe(payload.username);
  });

  it('issues a token that expires and carries no secret material', async () => {
    const { token, user } = await registerAndLogin();

    const claims = jwt.verify(token, process.env.JWT_SECRET_KEY);

    expect(claims.sub).toBe(user.id);
    expect(claims.exp).toBeGreaterThan(claims.iat);
    expect(claims).not.toHaveProperty('password');
    expect(claims).not.toHaveProperty('salt');
    expect(claims).not.toHaveProperty('_doc');
  });

  it('rejects a wrong password without revealing whether the user exists', async () => {
    const payload = buildUser();
    await request(app).post('/api/users').send(payload).expect(201);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ username: payload.username, password: 'not-the-password' })
      .expect(401);

    const unknownUser = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody-at-all', password: DEFAULT_PASSWORD })
      .expect(401);

    expect(wrongPassword.body.error.message).toBe(unknownUser.body.error.message);
  });

  it('rejects a malformed login body with 400, not 200', async () => {
    const response = await request(app).post('/api/auth/login').send({}).expect(400);

    expect(response.body.error.status).toBe(400);
  });
});

describe('bearer token handling', () => {
  it('rejects a request with no token', async () => {
    await request(app).get('/api/me').expect(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = jwt.sign({ sub: '64b7f0e2f1a2b3c4d5e6f701' }, 'a-different-secret');

    await request(app).get('/api/me').set('Authorization', `Bearer ${forged}`).expect(401);
  });

  it('rejects an expired token', async () => {
    const { user } = await registerAndLogin();
    const expired = jwt.sign({ sub: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '-1s' });

    await request(app).get('/api/me').set('Authorization', `Bearer ${expired}`).expect(401);
  });

  it('rejects a valid token whose account has since been deleted', async () => {
    const { authHeader } = await registerAndLogin();

    await request(app).delete('/api/me').set('Authorization', authHeader).expect(204);

    await request(app).get('/api/me').set('Authorization', authHeader).expect(401);
  });
});
