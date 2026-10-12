// Bu dosyada fotoğraf istek sınırı düşük tutulur (uygulama yüklenmeden önce ayarlanmalı)
process.env.IMAGE_RATE_LIMIT = '3';

const request = require('supertest');
const app = require('../app');
const Image = require('../models/Image');
const { newId } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

describe('photo request limit', () => {
  test('one IP cannot pull photos without limit; other API routes have their own allowance', async () => {
    jest.spyOn(Image, 'findById').mockReturnValue({
      select: () => Promise.resolve({ data: Buffer.from([0xff, 0xd8, 0xff]), contentType: 'image/jpeg' }),
    });
    const get = () => request(app).get(`/api/images/${newId()}`);

    for (let i = 0; i < 3; i += 1) expect((await get()).status).toBe(200);
    const blocked = await get();
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();

    // Fotoğraf sınırı dolsa da uygulamanın geri kalanı çalışır
    expect((await request(app).get('/api/blogs/not-an-id')).status).toBe(404);
  });
});
