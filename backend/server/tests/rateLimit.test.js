// Bu dosyada giriş deneme sınırı düşük tutulur (uygulama yüklenmeden önce ayarlanmalı)
process.env.AUTH_RATE_LIMIT = '3';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const User = require('../models/User');

afterEach(() => jest.restoreAllMocks());

describe('login rate limit', () => {
  test('blocks an IP after too many failed attempts', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const attempt = () => request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'wrong' });

    for (let i = 0; i < 3; i += 1) {
      expect((await attempt()).status).toBe(400);
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Too many attempts/);
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  test('once blocked, even the correct password is refused until the window ends', async () => {
    const password = await bcrypt.hash('correct', 4);
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'u1', password });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'correct' });
    expect(res.status).toBe(429);
  });

  test('successful logins do not count towards the limit', async () => {
    // Sayaçları sıfır olan yeni bir uygulama örneği
    let freshApp;
    let FreshUser;
    jest.isolateModules(() => {
      freshApp = require('../app');
      FreshUser = require('../models/User');
    });
    const password = await bcrypt.hash('correct', 4);
    jest.spyOn(FreshUser, 'findOne').mockResolvedValue({ _id: 'u1', password });

    for (let i = 0; i < 5; i += 1) {
      const res = await request(freshApp).post('/api/auth/login').send({ email: 'a@b.com', password: 'correct' });
      expect(res.status).toBe(200);
    }
  });
});
