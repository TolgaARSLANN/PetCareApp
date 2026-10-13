const request = require('supertest');
const config = require('../config');
const app = require('../app');

const SECRET = 'a'.repeat(64);

describe('proxy secret (only the site may reach the API in production)', () => {
  beforeEach(() => {
    config.proxySecret = SECRET;
  });
  afterEach(() => {
    config.proxySecret = '';
    jest.restoreAllMocks();
  });

  test('refuses API requests without the secret', async () => {
    const res = await request(app).get('/api/blogs');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Forbidden' });
  });

  test('refuses a wrong secret, including one of a different length', async () => {
    for (const wrong of ['b'.repeat(64), 'short']) {
      const res = await request(app).post('/api/auth/login').set('X-Proxy-Secret', wrong).send({});
      expect(res.status).toBe(403);
    }
  });

  test('lets requests with the secret through', async () => {
    const res = await request(app).get('/api/nope').set('X-Proxy-Secret', SECRET);
    expect(res.status).toBe(404); // reached the API's own routing
  });

  test('keeps the health check open for the host', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).not.toBe(403);
    expect(res.body).toHaveProperty('database');
  });

  test('checks nothing when no secret is configured (development, tests)', async () => {
    config.proxySecret = '';
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
  });
});
