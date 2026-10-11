const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');

afterEach(() => jest.restoreAllMocks());

describe('POST /api/auth/register', () => {
  test('rejects a request without a password (and does not crash)', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  test('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'nope', password: '123456' });
    expect(res.status).toBe(400);
  });

  test('rejects an email that is already registered', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ email: 'a@b.com' });
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email in use');
  });

  test('creates the user with a hashed password', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(User, 'create').mockResolvedValue({});
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: '123456' });
    expect(res.status).toBe(201);
    const saved = create.mock.calls[0][0];
    expect(saved.password).not.toBe('123456');
    expect(await bcrypt.compare('123456', saved.password)).toBe(true);
  });

  test('returns 500 instead of crashing when the database fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(User, 'findOne').mockRejectedValue(new Error('db down'));
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: '123456' });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/auth/login', () => {
  test('requires email and password', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('rejects a wrong password', async () => {
    const password = await bcrypt.hash('correct', 4);
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'u1', password });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'wrong' });
    expect(res.status).toBe(400);
  });

  test('sets the token in a secure httpOnly cookie, not in the body', async () => {
    const password = await bcrypt.hash('correct', 4);
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'u1', password });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'u1' });
    expect(res.body.token).toBeUndefined();

    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('token='));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api/);
    expect(cookie).toMatch(/Expires=/);
    const token = cookie.split(';')[0].slice('token='.length);
    expect(jwt.verify(token, 'test-secret').userId).toBe('u1');
  });
});

describe('session endpoints', () => {
  const tokenCookie = (userId) => `token=${jwt.sign({ userId }, 'test-secret')}`;

  test('GET /me returns the user id from the cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', tokenCookie('u42'));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'u42' });
  });

  test('GET /me without a session answers "nobody"', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: null });
  });

  test('GET /me does not trust a forged token', async () => {
    const forged = `token=${jwt.sign({ userId: 'u42' }, 'not-the-secret')}`;
    const res = await request(app).get('/api/auth/me').set('Cookie', forged);
    expect(res.body).toEqual({ userId: null });
  });

  test('protected routes reject a forged token', async () => {
    const forged = `token=${jwt.sign({ userId: 'u42' }, 'not-the-secret')}`;
    const res = await request(app).get('/api/pets').set('Cookie', forged);
    expect(res.status).toBe(401);
  });

  test('protected routes accept the cookie', async () => {
    jest.spyOn(require('../models/Pet'), 'find').mockResolvedValue([]);
    const res = await request(app).get('/api/pets').set('Cookie', tokenCookie('507f1f77bcf86cd799439011'));
    expect(res.status).toBe(200);
  });

  test('POST /logout clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout').set('Cookie', tokenCookie('u42'));
    expect(res.status).toBe(204);
    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('token='));
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});

describe('hardening', () => {
  test('sends security headers', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('malformed JSON is a 400, not a 500', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
  });

  test('rejects an oversized body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'x'.repeat(200 * 1024) });
    expect(res.status).toBe(413);
  });
});
