const request = require('supertest');
const app = require('../app');
const Blog = require('../models/Blog');
const Image = require('../models/Image');
const { parseImageDataUrl, MAX_IMAGE_BYTES } = require('../services/images');
const { newId, tokenFor } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

// Küçük "dosyalar": imza baytları ve piksel ölçülerini taşıyan başlıkları gerçek, gerisi dolgu.
// Sunucu dosyayı açmaz; yalnızca imzaya ve başlıktaki ölçülere bakar.
const pad = (head, size = 64) => Buffer.concat([head, Buffer.alloc(size)]);
const u16be = (n) => [(n >> 8) & 0xff, n & 0xff];
const u16le = (n) => [n & 0xff, (n >> 8) & 0xff];
const u24le = (n) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff];

// JPEG: SOI, APP0 (JFIF), SOF0 (ölçüler)
// prettier-ignore
const jpegHead = (width, height) =>
  Buffer.from([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x10, ...Buffer.from('JFIF'), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0,
    0xff, 0xc0, 0x00, 0x11, 0x08, ...u16be(height), ...u16be(width), 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
  ]);
// PNG: imza + IHDR (ölçüler)
const pngHead = (width, height) => {
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4, 'ascii');
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ihdr]);
};
// WebP: kayıplı (VP8), kayıpsız (VP8L), genişletilmiş (VP8X)
const riff = (chunk, body) =>
  Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from(`WEBP${chunk}`), Buffer.alloc(4), body]);
const webpVp8 = (width, height) =>
  riff('VP8 ', Buffer.from([0, 0, 0, 0x9d, 0x01, 0x2a, ...u16le(width), ...u16le(height)]));
const webpVp8l = (width, height) => {
  const bits = (width - 1) | ((height - 1) << 14);
  return riff(
    'VP8L',
    Buffer.from([0x2f, bits & 0xff, (bits >>> 8) & 0xff, (bits >>> 16) & 0xff, (bits >>> 24) & 0xff])
  );
};
const webpVp8x = (width, height) =>
  riff('VP8X', Buffer.from([0x10, 0, 0, 0, ...u24le(width - 1), ...u24le(height - 1)]));

const JPEG = pad(jpegHead(1600, 1200));
const PNG = pad(pngHead(800, 600));
const WEBP = pad(webpVp8(1600, 1200));
const GIF = pad(Buffer.from('GIF89a'));
const dataUrl = (type, buffer) => `data:${type};base64,${buffer.toString('base64')}`;

describe('parseImageDataUrl', () => {
  test('accepts JPEG, PNG and WebP judged by their content', () => {
    expect(parseImageDataUrl(dataUrl('image/jpeg', JPEG)).contentType).toBe('image/jpeg');
    expect(parseImageDataUrl(dataUrl('image/png', PNG)).contentType).toBe('image/png');
    const webp = parseImageDataUrl(dataUrl('image/webp', WEBP));
    expect(webp.contentType).toBe('image/webp');
    expect(webp.data.equals(WEBP)).toBe(true);
  });

  test('rejects other formats, disguised files and non-images', () => {
    const message = (value) => {
      try {
        parseImageDataUrl(value);
        return null;
      } catch (err) {
        return [err.status, err.message];
      }
    };
    expect(message(dataUrl('image/gif', GIF))).toEqual([400, 'Only JPEG, PNG and WebP images are accepted']);
    // GIF içeriği "image/png" olarak bildirilmiş
    expect(message(dataUrl('image/png', GIF))).toEqual([400, 'Only JPEG, PNG and WebP images are accepted']);
    // PNG içeriği JPEG olarak bildirilmiş
    expect(message(dataUrl('image/jpeg', PNG))).toEqual([400, 'Image content does not match its type']);
    expect(message(dataUrl('text/html', Buffer.from('<script>alert(1)</script>')))[0]).toBe(400);
    expect(message(42)[0]).toBe(400);
  });

  test('reads the pixel size of every format from its header, without opening the file', () => {
    const size = (type, buffer) => {
      const { width, height } = parseImageDataUrl(dataUrl(type, pad(buffer)));
      return [width, height];
    };
    expect(size('image/jpeg', jpegHead(1600, 1200))).toEqual([1600, 1200]);
    expect(size('image/png', pngHead(800, 600))).toEqual([800, 600]);
    expect(size('image/webp', webpVp8(1600, 1200))).toEqual([1600, 1200]);
    expect(size('image/webp', webpVp8l(1200, 1600))).toEqual([1200, 1600]);
    expect(size('image/webp', webpVp8x(1024, 768))).toEqual([1024, 768]);
  });

  test('refuses "photo bombs": small files that open as huge images', () => {
    const tooBig = [
      ['image/png', pngHead(20000, 20000)],
      ['image/jpeg', jpegHead(4097, 100)],
      ['image/webp', webpVp8l(100, 5000)],
      ['image/webp', webpVp8x(16000, 16000)],
    ];
    tooBig.forEach(([type, head]) =>
      expect(() => parseImageDataUrl(dataUrl(type, pad(head)))).toThrow('Image dimensions are too large')
    );
    // 4096 px tam sınırda kabul edilir
    expect(parseImageDataUrl(dataUrl('image/png', pad(pngHead(4096, 4096)))).width).toBe(4096);
  });

  test('refuses files whose size cannot be read', () => {
    const noFrameHeader = pad(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0, 0, 0xff, 0xda]));
    expect(() => parseImageDataUrl(dataUrl('image/jpeg', noFrameHeader))).toThrow('Image could not be read');
    const zeroSize = pad(pngHead(0, 600));
    expect(() => parseImageDataUrl(dataUrl('image/png', zeroSize))).toThrow('Image could not be read');
  });

  test('rejects images over 2 MB', () => {
    const big = pad(JPEG, MAX_IMAGE_BYTES);
    expect(() => parseImageDataUrl(dataUrl('image/jpeg', big))).toThrow('Image is too large');
  });
});

describe('blog cover photos', () => {
  const userId = newId();
  const auth = `Bearer ${tokenFor(userId)}`;
  const post = { title: 'Başlık', content: 'İçerik', author: 'Tolga' };

  // Veritabanı yerine: yeni fotoğraf kaydı ve yazının kaydı (şema doğrulaması çalışır)
  const mockImageCreate = () =>
    jest.spyOn(Image, 'create').mockImplementation(async (doc) => ({ _id: newId(), ...doc }));
  const mockSave = () =>
    jest.spyOn(Blog.prototype, 'save').mockImplementation(async function save() {
      await this.validate();
      return this;
    });

  test('a new post stores the photo and links it', async () => {
    const create = mockImageCreate();
    mockSave();
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', auth)
      .send({ ...post, imageData: dataUrl('image/webp', WEBP) });

    expect(res.status).toBe(201);
    const stored = create.mock.calls[0][0];
    expect(stored).toMatchObject({ contentType: 'image/webp', size: WEBP.length });
    expect(String(stored.ownerId)).toBe(String(userId));
    expect(res.body.image).toMatch(/^\/api\/images\/[0-9a-f]{24}$/);
    expect(res.body.imageId).toBe(res.body.image.split('/').pop());
  });

  test('an invalid post does not store the photo', async () => {
    const create = mockImageCreate();
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', auth)
      .send({ title: '', content: 'x', author: 'y', imageData: dataUrl('image/jpeg', JPEG) });
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  test('if saving the post fails, the stored photo is removed again', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockImageCreate();
    jest.spyOn(Blog.prototype, 'save').mockRejectedValue(new Error('db down'));
    const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', auth)
      .send({ ...post, imageData: dataUrl('image/jpeg', JPEG) });
    expect(res.status).toBe(500);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  test('a disguised or unsupported file is refused with a clear message', async () => {
    const create = mockImageCreate();
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', auth)
      .send({ ...post, imageData: dataUrl('image/png', GIF) });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Only JPEG, PNG and WebP images are accepted');
    expect(create).not.toHaveBeenCalled();
  });

  test('a new post cannot use an image from another website', async () => {
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', auth)
      .send({ ...post, image: 'https://tracker.example/pixel.gif' });
    expect(res.status).toBe(400);
  });

  test('a post cannot point at an uploaded photo it does not own', async () => {
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', auth)
      .send({ ...post, image: `/api/images/${newId()}` });
    expect(res.status).toBe(400);
  });

  test('a body of a few MB reaches the blog routes but not the others', async () => {
    mockImageCreate();
    mockSave();
    const nearLimit = pad(JPEG, MAX_IMAGE_BYTES - 1000); // ~2.7 MB as base64 JSON
    const blogRes = await request(app)
      .post('/api/blogs')
      .set('Authorization', auth)
      .send({ ...post, imageData: dataUrl('image/jpeg', nearLimit) });
    expect(blogRes.status).toBe(201);

    // Fotoğraf taşımayan bir adres (ör. kilo kaydı) 100 KB'lık genel sınırda kalır
    const weightRes = await request(app)
      .post(`/api/pets/${newId()}/weight`)
      .set('Authorization', auth)
      .send({ notes: 'x'.repeat(200 * 1024) });
    expect(weightRes.status).toBe(413);
  });

  describe('editing', () => {
    const oldImageId = newId();
    const existing = () => {
      const blog = new Blog({
        ...post,
        authorId: userId,
        image: `/api/images/${oldImageId}`,
        imageId: oldImageId,
      });
      jest.spyOn(blog, 'save').mockImplementation(async function save() {
        await this.validate();
        return this;
      });
      jest.spyOn(Blog, 'findOne').mockResolvedValue(blog);
      return blog;
    };
    const put = (body) => request(app).put(`/api/blogs/${newId()}`).set('Authorization', auth).send(body);

    test('keeping the photo leaves it alone', async () => {
      const blog = existing();
      const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
      const res = await put({ ...post, title: 'Yeni başlık', image: blog.image });
      expect(res.status).toBe(200);
      expect(res.body.image).toBe(`/api/images/${oldImageId}`);
      expect(remove).not.toHaveBeenCalled();
    });

    test('leaving out the image field leaves the photo alone too', async () => {
      existing();
      const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
      const res = await put({ ...post, title: 'Yeni başlık' });
      expect(res.body.image).toBe(`/api/images/${oldImageId}`);
      expect(remove).not.toHaveBeenCalled();
    });

    test('a new photo replaces the old one, which is deleted', async () => {
      existing();
      mockImageCreate();
      const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
      const res = await put({ ...post, image: `/api/images/${oldImageId}`, imageData: dataUrl('image/png', PNG) });
      expect(res.status).toBe(200);
      expect(res.body.image).not.toBe(`/api/images/${oldImageId}`);
      expect(String(remove.mock.calls[0][0]._id)).toBe(String(oldImageId));
    });

    test('removing the photo deletes it', async () => {
      existing();
      const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
      const res = await put({ ...post, image: '' });
      expect(res.status).toBe(200);
      expect(res.body.image).toBeUndefined();
      expect(res.body.imageId).toBeUndefined();
      expect(String(remove.mock.calls[0][0]._id)).toBe(String(oldImageId));
    });

    test("pointing at someone else's photo is refused", async () => {
      existing();
      const res = await put({ ...post, image: `/api/images/${newId()}` });
      expect(res.status).toBe(400);
    });
  });

  test('an older post keeps its https image when edited, but cannot switch to another website', async () => {
    const legacy = new Blog({ ...post, authorId: userId, image: 'https://example.com/eski.jpg' });
    jest.spyOn(legacy, 'save').mockImplementation(async function save() {
      await this.validate();
      return this;
    });
    jest.spyOn(Blog, 'findOne').mockResolvedValue(legacy);
    const put = (body) => request(app).put(`/api/blogs/${newId()}`).set('Authorization', auth).send(body);

    const kept = await put({ ...post, title: 'Yeni başlık', image: 'https://example.com/eski.jpg' });
    expect(kept.status).toBe(200);
    expect(kept.body.image).toBe('https://example.com/eski.jpg');

    const switched = await put({ ...post, image: 'https://tracker.example/pixel.gif' });
    expect(switched.status).toBe(400);
  });

  test('deleting a post deletes its photo', async () => {
    const imageId = newId();
    jest.spyOn(Blog, 'findOneAndDelete').mockResolvedValue({ _id: newId(), imageId });
    const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
    const res = await request(app).delete(`/api/blogs/${newId()}`).set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(String(remove.mock.calls[0][0]._id)).toBe(String(imageId));
  });
});

describe('GET /api/images/:id', () => {
  test('serves the photo with its type, cached by the browser only', async () => {
    jest.spyOn(Image, 'findById').mockReturnValue({
      select: () => Promise.resolve({ data: WEBP, contentType: 'image/webp' }),
    });
    const res = await request(app).get(`/api/images/${newId()}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/webp');
    expect(res.headers['cache-control']).toBe('private, max-age=604800, immutable');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(Buffer.from(res.body).equals(WEBP)).toBe(true);
  });

  test('unknown or malformed ids are a 404', async () => {
    jest.spyOn(Image, 'findById').mockReturnValue({ select: () => Promise.resolve(null) });
    expect((await request(app).get(`/api/images/${newId()}`)).status).toBe(404);
    expect((await request(app).get('/api/images/not-an-id')).status).toBe(404);
  });
});

describe('abuse limits', () => {
  const mockStoring = () => {
    jest.spyOn(Image, 'create').mockImplementation(async (doc) => ({ _id: newId(), ...doc }));
    jest.spyOn(Blog.prototype, 'save').mockImplementation(async function save() {
      await this.validate();
      return this;
    });
  };
  const post = { title: 'Başlık', content: 'İçerik', author: 'Tolga' };

  test('a large body from someone who is not logged in is refused before it is read', async () => {
    const big = `{"title":"${'a'.repeat(2.9 * 1024 * 1024)}"`; // bozuk JSON: okunsaydı 400 olurdu
    const res = await request(app).post('/api/blogs').set('Content-Type', 'application/json').send(big);
    expect(res.status).toBe(401);
  });

  test('photo uploads per user are limited per hour; posts without a photo are not', async () => {
    mockStoring();
    const auth = `Bearer ${tokenFor(newId())}`;
    const upload = () =>
      request(app)
        .post('/api/blogs')
        .set('Authorization', auth)
        .send({ ...post, imageData: dataUrl('image/jpeg', JPEG) });

    for (let i = 0; i < 20; i += 1) expect((await upload()).status).toBe(201);
    const blocked = await upload();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe('Too many photo uploads, please try again later');

    const textOnly = await request(app).post('/api/blogs').set('Authorization', auth).send(post);
    expect(textOnly.status).toBe(201);

    // Başka bir kullanıcı etkilenmez
    const other = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${tokenFor(newId())}`)
      .send({ ...post, imageData: dataUrl('image/jpeg', JPEG) });
    expect(other.status).toBe(201);
  });

  test('refused uploads do not use up the hourly allowance', async () => {
    mockStoring();
    const auth = `Bearer ${tokenFor(newId())}`;
    for (let i = 0; i < 25; i += 1) {
      const bad = await request(app)
        .post('/api/blogs')
        .set('Authorization', auth)
        .send({ ...post, imageData: dataUrl('image/png', GIF) });
      expect(bad.status).toBe(400);
    }
    const ok = await request(app)
      .post('/api/blogs')
      .set('Authorization', auth)
      .send({ ...post, imageData: dataUrl('image/jpeg', JPEG) });
    expect(ok.status).toBe(201);
  });

  test("a user's photos together cannot exceed 25 MB", async () => {
    mockStoring();
    const userId = newId();
    const aggregate = jest.spyOn(Image, 'aggregate').mockResolvedValue([{ _id: null, total: 25 * 1024 * 1024 - 10 }]);
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ ...post, imageData: dataUrl('image/jpeg', JPEG) });

    expect(res.status).toBe(413);
    expect(res.body.error).toBe('Photo storage limit reached');
    expect(Image.create).not.toHaveBeenCalled();
    // Kimlik ObjectId olarak eşleştirilir (metin kimlik hiçbir fotoğrafla eşleşmez, sınır işlemezdi)
    const owner = aggregate.mock.calls[0][0][0].$match.ownerId;
    expect(owner).toBeInstanceOf(require('mongoose').Types.ObjectId);
    expect(String(owner)).toBe(String(userId));
  });

  test('uploads sent at the same time cannot together go over the storage limit', async () => {
    // Veritabanı yerine: saklanan fotoğraflar listesi; sayma ve kaydetme gecikmeli (gerçek bir veritabanı gibi)
    const stored = [];
    const tick = () => new Promise((r) => setTimeout(r, 5));
    jest.spyOn(Image, 'aggregate').mockImplementation(async () => {
      await tick();
      return [{ _id: null, total: stored.reduce((sum, size) => sum + size, 0) }];
    });
    jest.spyOn(Image, 'create').mockImplementation(async (doc) => {
      await tick();
      stored.push(doc.size);
      return { _id: newId(), ...doc };
    });
    jest.spyOn(Blog.prototype, 'save').mockImplementation(async function save() {
      return this;
    });
    const auth = `Bearer ${tokenFor(newId())}`;
    const photo = dataUrl('image/jpeg', pad(JPEG, 1.5 * 1024 * 1024)); // ~1.5 MB

    const statuses = await Promise.all(
      Array.from({ length: 18 }, () =>
        request(app)
          .post('/api/blogs')
          .set('Authorization', auth)
          .send({ ...post, imageData: photo })
          .then((r) => r.status)
      )
    );

    const total = stored.reduce((sum, size) => sum + size, 0);
    expect(total).toBeLessThanOrEqual(25 * 1024 * 1024);
    expect(statuses.filter((s) => s === 201)).toHaveLength(16); // 16 × 1.5 MB = 24 MB
    expect(statuses.filter((s) => s === 413)).toHaveLength(2);
  });

  test('replacing a photo does not count the photo being replaced', async () => {
    const userId = newId();
    const oldImageId = newId();
    const blog = new Blog({ ...post, authorId: userId, image: `/api/images/${oldImageId}`, imageId: oldImageId });
    jest.spyOn(blog, 'save').mockResolvedValue(blog);
    jest.spyOn(Blog, 'findOne').mockResolvedValue(blog);
    jest.spyOn(Image, 'create').mockImplementation(async (doc) => ({ _id: newId(), ...doc }));
    jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
    const aggregate = jest.spyOn(Image, 'aggregate').mockResolvedValue([]);

    const res = await request(app)
      .put(`/api/blogs/${newId()}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ ...post, image: blog.image, imageData: dataUrl('image/png', PNG) });

    expect(res.status).toBe(200);
    expect(String(aggregate.mock.calls[0][0][0].$match._id.$ne)).toBe(String(oldImageId));
  });
});
