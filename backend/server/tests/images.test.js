const request = require('supertest');
const app = require('../app');
const Blog = require('../models/Blog');
const Image = require('../models/Image');
const { parseImageDataUrl, MAX_IMAGE_BYTES } = require('../services/images');
const { newId, tokenFor } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

// Yalnızca imza baytları gerçek olan küçük "dosyalar" (içerik doğrulaması imzaya bakar)
const pad = (head, size = 64) => Buffer.concat([head, Buffer.alloc(size)]);
const JPEG = pad(Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
const PNG = pad(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const WEBP = pad(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]));
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

    const petRes = await request(app)
      .post('/api/pets')
      .set('Authorization', auth)
      .send({ name: 'x'.repeat(200 * 1024) });
    expect(petRes.status).toBe(413);
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
