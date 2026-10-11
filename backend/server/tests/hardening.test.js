const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app');
const Blog = require('../models/Blog');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { newId } = require('./helpers');

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const DAY = 24 * 60 * 60;
const now = () => Math.floor(Date.now() / 1000);
const tokenCookieFrom = (res) => res.headers['set-cookie']?.find((c) => c.startsWith('token='));
const claimsOf = (cookie) => jwt.verify(cookie.split(';')[0].slice('token='.length), 'test-secret');

describe('blog cover image', () => {
  const blog = (image) => new Blog({ title: 'T', content: 'C', author: 'A', authorId: newId(), image });
  const invalid = (image) => Boolean(blog(image).validateSync()?.errors?.image);

  test('only https URLs are accepted', () => {
    expect(invalid('https://example.com/cat.jpg')).toBe(false);
    expect(invalid('')).toBe(false);
    expect(invalid(undefined)).toBe(false);
    expect(invalid('http://example.com/cat.jpg')).toBe(true);
    expect(invalid('javascript:alert(1)')).toBe(true);
    expect(invalid('data:image/svg+xml,<svg/>')).toBe(true);
    expect(invalid('not a url')).toBe(true);
  });
});

describe('password length in bytes (bcrypt reads only 72)', () => {
  const at72 = 'a'.repeat(72);

  test('register accepts 72 bytes and rejects more', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockResolvedValue({});
    const register = (password) => request(app).post('/api/auth/register').send({ email: 'a@b.com', password });

    expect((await register(at72)).status).toBe(201);
    const res = await register(`${at72}X`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must be at most 72 bytes');
  });

  test('Turkish letters count as 2 bytes', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'ğ'.repeat(37) }); // 37 harf = 74 bayt
    expect(res.status).toBe(400);
  });

  test('a new password longer than 72 bytes is rejected', async () => {
    const userId = newId();
    jest.spyOn(User, 'findById').mockResolvedValue({ _id: userId, password: 'x' });
    const token = jwt.sign({ userId: String(userId) }, 'test-secret');
    const res = await request(app)
      .put('/api/auth/password')
      .set('Cookie', `token=${token}`)
      .send({ currentPassword: 'current', newPassword: `${at72}X` });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must be at most 72 bytes');
  });
});

describe('login timing', () => {
  test('an unknown email still runs a password comparison', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const compare = jest.spyOn(bcrypt, 'compare');
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@b.com', password: 'whatever' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
    expect(compare).toHaveBeenCalledTimes(1);
  });
});

describe('sliding session', () => {
  const userId = '507f1f77bcf86cd799439011';
  const cookie = ({ iat, exp, at, tv = 2 }) => `token=${jwt.sign({ userId, tv, at, iat, exp }, 'test-secret')}`;
  const callApi = (c) => {
    jest.spyOn(Pet, 'find').mockResolvedValue([]);
    return request(app).get('/api/pets').set('Cookie', c);
  };

  test('a fresh token is left alone', async () => {
    const t = now();
    const res = await callApi(cookie({ iat: t - 60, exp: t - 60 + DAY, at: t - 60 }));
    expect(res.status).toBe(200);
    expect(tokenCookieFrom(res)).toBeUndefined();
  });

  test('past half of its lifetime, an active session gets a new token with the same login time', async () => {
    const t = now();
    const at = t - 3 * DAY;
    const res = await callApi(cookie({ iat: t - 13 * 3600, exp: t + 11 * 3600, at }));
    const renewed = tokenCookieFrom(res);
    expect(renewed).toMatch(/HttpOnly/i);
    const claims = claimsOf(renewed);
    expect(claims.exp).toBeGreaterThan(t + 23 * 3600);
    expect(claims.at).toBe(at);
    expect(claims.tv).toBe(2);
    expect(claims.userId).toBe(userId);
  });

  test('GET /me slides the session too', async () => {
    const t = now();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie({ iat: t - 20 * 3600, exp: t + 4 * 3600, at: t - DAY }));
    expect(res.body).toEqual({ userId });
    expect(tokenCookieFrom(res)).toBeDefined();
  });

  test('the session stops sliding 30 days after login', async () => {
    const t = now();
    const res = await callApi(cookie({ iat: t - 20 * 3600, exp: t + 4 * 3600, at: t - 31 * DAY }));
    expect(res.status).toBe(200);
    expect(tokenCookieFrom(res)).toBeUndefined();
  });

  test('login records the login time', async () => {
    const password = await bcrypt.hash('correct', 4);
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: userId, password, tokenVersion: 0 });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'correct' });
    expect(Math.abs(claimsOf(tokenCookieFrom(res)).at - now())).toBeLessThanOrEqual(2);
  });

  test('Bearer clients are not given cookies', async () => {
    const t = now();
    jest.spyOn(Pet, 'find').mockResolvedValue([]);
    const token = jwt.sign({ userId, iat: t - 20 * 3600, exp: t + 4 * 3600, at: t }, 'test-secret');
    const res = await request(app).get('/api/pets').set('Authorization', `Bearer ${token}`);
    expect(tokenCookieFrom(res)).toBeUndefined();
  });
});
