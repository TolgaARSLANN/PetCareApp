const request = require('supertest');
const database = require('../services/database');
const app = require('../app');

afterEach(() => jest.restoreAllMocks());

describe('GET /api/health', () => {
  test('reports a missing database connection as 503 (so the host restarts the service)', async () => {
    // Testler veritabanına bağlanmaz
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'unavailable', database: 'disconnected' });
  });

  test('is ok with a connection and shows the IP the server sees for the caller', async () => {
    jest.spyOn(database, 'isConnected').mockReturnValue(true);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.clientIp).toMatch(/127\.0\.0\.1|::1/);
  });

  test('lists the proxy chain nearest first, so TRUST_PROXY can be read off it', async () => {
    jest.spyOn(database, 'isConnected').mockReturnValue(true);
    const res = await request(app)
      .get('/api/health')
      .set('X-Forwarded-For', '203.0.113.7, 198.51.100.2');
    expect(res.body.proxyChain).toHaveLength(3);
    expect(res.body.proxyChain[0]).toMatch(/127\.0\.0\.1|::1/);
    expect(res.body.proxyChain.slice(1)).toEqual(['198.51.100.2', '203.0.113.7']);
  });
});
