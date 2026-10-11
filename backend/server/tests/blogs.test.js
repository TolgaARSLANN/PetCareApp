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
    const update = jest.spyOn(Blog, 'findOneAndUpdate').mockResolvedValue(null);
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
