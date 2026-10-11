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

  test('returns a token signed with the configured secret', async () => {
    const password = await bcrypt.hash('correct', 4);
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'u1', password });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'correct' });
    expect(res.status).toBe(200);
    expect(jwt.verify(res.body.token, 'test-secret').userId).toBe('u1');
  });
});
