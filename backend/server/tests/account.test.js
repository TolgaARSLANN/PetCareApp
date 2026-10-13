const jwt = require('jsonwebtoken');
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Blog = require('../models/Blog');
const Image = require('../models/Image');
const { newId, tokenFor } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

// Veritabanına gitmeden bir kullanıcı dokümanı; parola "correct"
const mockUser = async (userId) => {
  const user = new User({ _id: userId, email: 'a@b.com', password: await bcrypt.hash('correct', 4) });
  jest.spyOn(user, 'save').mockResolvedValue(user);
  jest.spyOn(User, 'findById').mockResolvedValue(user);
  return user;
};

describe('GET /api/auth/account', () => {
  test('returns the email and how many pets and posts belong to the account', async () => {
    const userId = newId();
    jest.spyOn(User, 'findById').mockReturnValue({ select: () => Promise.resolve({ email: 'a@b.com' }) });
    const pets = jest.spyOn(Pet, 'countDocuments').mockResolvedValue(3);
    jest.spyOn(Blog, 'countDocuments').mockResolvedValue(2);

    const res = await request(app).get('/api/auth/account').set('Authorization', `Bearer ${tokenFor(userId)}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: 'a@b.com', displayName: null, petCount: 3, blogCount: 2 });
    expect(String(pets.mock.calls[0][0].ownerId)).toBe(String(userId));
  });

  test('requires a session', async () => {
    expect((await request(app).get('/api/auth/account')).status).toBe(401);
  });
});

describe('PUT /api/auth/password', () => {
  const change = (userId, body) =>
    request(app).put('/api/auth/password').set('Authorization', `Bearer ${tokenFor(userId)}`).send(body);

  test('changes the password and renews the session cookie', async () => {
    const userId = newId();
    const user = await mockUser(userId);

    const res = await change(userId, { currentPassword: 'correct', newPassword: 'new-secret' });

    expect(res.status).toBe(200);
    expect(await bcrypt.compare('new-secret', user.password)).toBe(true);
    expect(user.save).toHaveBeenCalled();
    expect(res.headers['set-cookie'].some((c) => c.startsWith('token=') && /HttpOnly/i.test(c))).toBe(true);
  });

  test('signs out other devices: bumps the session version and issues a token with the new one', async () => {
    const userId = newId();
    const user = await mockUser(userId);
    expect(user.tokenVersion).toBe(0);

    const res = await change(userId, { currentPassword: 'correct', newPassword: 'new-secret' });

    expect(user.tokenVersion).toBe(1);
    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('token='));
    const token = cookie.split(';')[0].slice('token='.length);
    expect(jwt.verify(token, process.env.JWT_SECRET).tv).toBe(1);
  });

  test('rejects a wrong current password without changing anything', async () => {
    const userId = newId();
    const user = await mockUser(userId);

    const res = await change(userId, { currentPassword: 'wrong', newPassword: 'new-secret' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Current password is incorrect');
    expect(user.save).not.toHaveBeenCalled();
  });

  test('validates the new password', async () => {
    const userId = newId();
    await mockUser(userId);
    expect((await change(userId, { currentPassword: 'correct', newPassword: '123' })).status).toBe(400);
    expect((await change(userId, { currentPassword: 'correct', newPassword: 'correct' })).body.message).toBe(
      'New password must be different'
    );
    expect((await change(userId, {})).status).toBe(400);
  });
});

describe('DELETE /api/auth/account', () => {
  const remove = (userId, body) =>
    request(app).delete('/api/auth/account').set('Authorization', `Bearer ${tokenFor(userId)}`).send(body);

  test("deletes the user with all of the user's pets and posts and ends the session", async () => {
    const userId = newId();
    await mockUser(userId);
    const pets = jest.spyOn(Pet, 'deleteMany').mockResolvedValue({ deletedCount: 3 });
    const blogs = jest.spyOn(Blog, 'deleteMany').mockResolvedValue({ deletedCount: 2 });
    const images = jest.spyOn(Image, 'deleteMany').mockResolvedValue({ deletedCount: 1 });
    const users = jest.spyOn(User, 'deleteOne').mockResolvedValue({ deletedCount: 1 });

    const res = await remove(userId, { password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deletedPets: 3, deletedBlogs: 2 });
    expect(String(pets.mock.calls[0][0].ownerId)).toBe(String(userId));
    expect(String(blogs.mock.calls[0][0].authorId)).toBe(String(userId));
    expect(String(images.mock.calls[0][0].ownerId)).toBe(String(userId)); // yazıların fotoğrafları da
    expect(String(users.mock.calls[0][0]._id)).toBe(String(userId));
    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('token='));
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  test('requires the correct password and deletes nothing otherwise', async () => {
    const userId = newId();
    await mockUser(userId);
    const pets = jest.spyOn(Pet, 'deleteMany');
    const users = jest.spyOn(User, 'deleteOne');

    expect((await remove(userId, { password: 'wrong' })).status).toBe(400);
    expect((await remove(userId, {})).status).toBe(400);
    expect(pets).not.toHaveBeenCalled();
    expect(users).not.toHaveBeenCalled();
  });

  test('requires a session', async () => {
    expect((await request(app).delete('/api/auth/account').send({ password: 'x' })).status).toBe(401);
  });
});

describe('GET /api/auth/account/export', () => {
  const chain = (result) => ({ select: () => ({ lean: () => Promise.resolve(result) }) });

  test('downloads all of the account data as a JSON file, without internal fields', async () => {
    const userId = newId();
    jest.spyOn(User, 'findById').mockReturnValue(chain({ email: 'a@b.com', password: 'hash', tokenVersion: 3 }));
    const petFind = jest.spyOn(Pet, 'find').mockReturnValue({
      lean: () =>
        Promise.resolve([
          { _id: 'p1', name: 'Pamuk', ownerId: userId, __v: 2, healthRecords: [{ notes: 'kontrol' }] },
        ]),
    });
    const blogFind = jest.spyOn(Blog, 'find').mockReturnValue({
      sort: () => ({ lean: () => Promise.resolve([{ _id: 'b1', title: 'Yazı', authorId: userId, __v: 0 }]) }),
    });

    const res = await request(app).get('/api/auth/account/export').set('Authorization', `Bearer ${tokenFor(userId)}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="pawfect-care-verilerim-\d{4}-\d{2}-\d{2}\.json"/);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.account).toEqual({ email: 'a@b.com', displayName: null });
    expect(res.body.pets).toEqual([{ _id: 'p1', name: 'Pamuk', healthRecords: [{ notes: 'kontrol' }] }]);
    expect(res.body.blogs).toEqual([{ _id: 'b1', title: 'Yazı' }]);
    expect(JSON.stringify(res.body)).not.toMatch(/hash|tokenVersion|ownerId|authorId/);
    // Yalnızca bu kullanıcının verileri
    expect(String(petFind.mock.calls[0][0].ownerId)).toBe(String(userId));
    expect(String(blogFind.mock.calls[0][0].authorId)).toBe(String(userId));
  });

  test('requires a session', async () => {
    const res = await request(app).get('/api/auth/account/export');
    expect(res.status).toBe(401);
  });
});
