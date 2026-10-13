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
});
