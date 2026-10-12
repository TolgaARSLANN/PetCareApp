const request = require('supertest');
const app = require('../app');
const Blog = require('../models/Blog');
const { newId, tokenFor } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

const blog = { title: 'Başlık', content: 'İçerik', author: 'Tolga' };

describe('blog write permissions', () => {
  test('creating a post without a token returns 401', async () => {
    const res = await request(app).post('/api/blogs').send(blog);
    expect(res.status).toBe(401);
  });

  test('creating a post stores the logged-in user as authorId', async () => {
    const userId = newId();
    jest.spyOn(Blog.prototype, 'save').mockImplementation(function () {
      return Promise.resolve(this);
    });
    const res = await request(app).post('/api/blogs').set('Authorization', `Bearer ${tokenFor(userId)}`).send(blog);
    expect(res.status).toBe(201);
    expect(res.body.authorId).toBe(String(userId));
  });

  test('deleting without a token returns 401', async () => {
    const res = await request(app).delete(`/api/blogs/${newId()}`);
    expect(res.status).toBe(401);
  });

  test('update and delete only match posts owned by the user', async () => {
    const userId = newId();
    const blogId = newId();
    const update = jest.spyOn(Blog, 'findOne').mockResolvedValue(null);
    const remove = jest.spyOn(Blog, 'findOneAndDelete').mockResolvedValue(null);
    const auth = `Bearer ${tokenFor(userId)}`;

    const putRes = await request(app).put(`/api/blogs/${blogId}`).set('Authorization', auth).send(blog);
    const delRes = await request(app).delete(`/api/blogs/${blogId}`).set('Authorization', auth);

    expect(putRes.status).toBe(404);
    expect(delRes.status).toBe(404);
    expect(String(update.mock.calls[0][0].authorId)).toBe(String(userId));
    expect(String(remove.mock.calls[0][0].authorId)).toBe(String(userId));
  });
});

describe('GET /api/blogs/:id', () => {
  test('a malformed id returns 404, not 500', async () => {
    const res = await request(app).get('/api/blogs/not-an-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/blogs pagination', () => {
  // Blog.find().sort().skip().limit() zincirini taklit eder ve çağrıları kaydeder
  const mockFind = (items = []) => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(items),
    };
    jest.spyOn(Blog, 'find').mockReturnValue(query);
    return query;
  };

  test('defaults to the first page of 9 posts, newest first', async () => {
    jest.spyOn(Blog, 'countDocuments').mockResolvedValue(20);
    const query = mockFind([{ title: 'a' }]);
    const res = await request(app).get('/api/blogs');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [{ title: 'a' }], page: 1, limit: 9, total: 20, totalPages: 3 });
    expect(query.sort).toHaveBeenCalledWith({ date: -1, _id: -1 });
    expect(query.skip).toHaveBeenCalledWith(0);
    expect(query.limit).toHaveBeenCalledWith(9);
  });

  test('skips earlier pages', async () => {
    jest.spyOn(Blog, 'countDocuments').mockResolvedValue(20);
    const query = mockFind();
    const res = await request(app).get('/api/blogs?page=2&limit=5');
    expect(res.body.page).toBe(2);
    expect(res.body.totalPages).toBe(4);
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(5);
  });

  test('a page past the end falls back to the last page', async () => {
    jest.spyOn(Blog, 'countDocuments').mockResolvedValue(10);
    const query = mockFind();
    const res = await request(app).get('/api/blogs?page=99');
    expect(res.body.page).toBe(2);
    expect(query.skip).toHaveBeenCalledWith(9);
  });

  test('invalid values use defaults and the limit is capped', async () => {
    jest.spyOn(Blog, 'countDocuments').mockResolvedValue(0);
    const query = mockFind();
    const res = await request(app).get('/api/blogs?page=-3&limit=1000');
    expect(res.body).toMatchObject({ page: 1, limit: 50, total: 0, totalPages: 1 });
    expect(query.skip).toHaveBeenCalledWith(0);

    await request(app).get('/api/blogs?page=abc&limit=0');
    expect(query.limit).toHaveBeenLastCalledWith(9);
  });
});
