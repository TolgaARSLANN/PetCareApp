const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Blog = require('../models/Blog');
const users = require('../services/users');
const { parseDisplayName, displayNameKey } = require('../services/displayName');
const { newId, tokenFor } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

const duplicateKeyError = (field) => Object.assign(new Error('E11000'), { code: 11000, keyPattern: { [field]: 1 } });

describe('display name rules', () => {
  test('accepts Turkish names and tidies the spaces', () => {
    expect(parseDisplayName('  Çağla   Öztürk ')).toBe('Çağla Öztürk');
    expect(parseDisplayName("O'Neil-İnce_2")).toBe("O'Neil-İnce_2");
    expect(parseDisplayName('Dr. Şule')).toBe('Dr. Şule');
  });

  test('refuses names that are too short, too long or not text', () => {
    expect(parseDisplayName('A')).toBeNull();
    expect(parseDisplayName('a'.repeat(41))).toBeNull();
    expect(parseDisplayName('a'.repeat(40))).toBe('a'.repeat(40));
    expect(parseDisplayName(undefined)).toBeNull();
    expect(parseDisplayName({ name: 'Ali' })).toBeNull();
  });

  test('refuses look-alike letters from other alphabets, symbols and names without letters', () => {
    expect(parseDisplayName('Tоlga')).toBeNull(); // Kiril "о"
    expect(parseDisplayName('Tolga 🐶')).toBeNull();
    expect(parseDisplayName('<b>Ali</b>')).toBeNull();
    expect(parseDisplayName('12345')).toBeNull();
    expect(parseDisplayName('...')).toBeNull();
  });

  test('names that only differ in letter case, spaces or punctuation are the same name', () => {
    const key = displayNameKey('Tolga Arslan');
    expect(displayNameKey('TOLGA ARSLAN')).toBe(key);
    expect(displayNameKey('tolga.arslan')).toBe(key);
    expect(displayNameKey('İpek Işık')).toBe(displayNameKey('ipek ışık'));
  });
});

describe('POST /api/auth/register with a display name', () => {
  const register = (body) =>
    request(app).post('/api/auth/register').send({ email: 'a@b.com', password: '123456', ...body });

  test('requires a valid display name', async () => {
    for (const displayName of [undefined, '', 'A', 'Tоlga']) {
      const res = await register({ displayName });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('A valid display name is required');
    }
  });

  test('refuses a name another account already uses', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const exists = jest.spyOn(User, 'exists').mockResolvedValue({ _id: newId() });
    const create = jest.spyOn(User, 'create');
    const res = await register({ displayName: 'TOLGA  arslan' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Display name in use');
    expect(exists).toHaveBeenCalledWith({ displayNameKey: 'tolgaarslan' });
    expect(create).not.toHaveBeenCalled();
  });

  test('two sign-ups taking the same name at once: the second gets "in use", not a server error', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockRejectedValue(duplicateKeyError('displayNameKey'));
    const res = await register({ displayName: 'Ali' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Display name in use');
  });

  test('the same for an email taken at the same moment', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockRejectedValue(duplicateKeyError('email'));
    const res = await register({ displayName: 'Ali' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email in use');
  });
});

describe('PUT /api/auth/display-name', () => {
  const userId = newId();
  const put = (displayName) =>
    request(app)
      .put('/api/auth/display-name')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ displayName });

  test('requires a session', async () => {
    const res = await request(app).put('/api/auth/display-name').send({ displayName: 'Ali' });
    expect(res.status).toBe(401);
  });

  test('sets the name and puts it on all of the user’s posts', async () => {
    const update = jest.spyOn(User, 'updateOne').mockResolvedValue({ matchedCount: 1 });
    const blogs = jest.spyOn(Blog, 'updateMany').mockResolvedValue({ modifiedCount: 2 });
    const res = await put('  Tolga   Arslan ');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ displayName: 'Tolga Arslan' });
    expect(String(update.mock.calls[0][0]._id)).toBe(String(userId));
    expect(update.mock.calls[0][1]).toEqual({ displayName: 'Tolga Arslan', displayNameKey: 'tolgaarslan' });
    expect(String(blogs.mock.calls[0][0].authorId)).toBe(String(userId));
    expect(blogs.mock.calls[0][1]).toEqual({ author: 'Tolga Arslan' });
  });

  test('refuses an invalid name', async () => {
    const update = jest.spyOn(User, 'updateOne');
    const res = await put('X');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('A valid display name is required');
    expect(update).not.toHaveBeenCalled();
  });

  test('refuses a name another account uses, but not the user’s own (changing only the letter case)', async () => {
    const exists = jest.spyOn(User, 'exists').mockImplementation(async (filter) => {
      if (!filter.displayNameKey) return { _id: userId }; // oturum kontrolü
      return null; // bu kullanıcının dışında bu adda kimse yok
    });
    jest.spyOn(User, 'updateOne').mockResolvedValue({ matchedCount: 1 });
    jest.spyOn(Blog, 'updateMany').mockResolvedValue({});
    expect((await put('tolga arslan')).status).toBe(200);
    const nameCheck = exists.mock.calls.find(([filter]) => filter.displayNameKey)[0];
    expect(String(nameCheck._id.$ne)).toBe(String(userId));

    exists.mockImplementation(async (filter) => (filter.displayNameKey ? { _id: newId() } : { _id: userId }));
    const res = await put('Tolga Arslan');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Display name in use');
  });

  test('a name taken at the same moment by someone else is "in use", not a server error', async () => {
    jest.spyOn(User, 'updateOne').mockRejectedValue(duplicateKeyError('displayNameKey'));
    const res = await put('Ali');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Display name in use');
  });
});

describe('blog posts are signed with the display name', () => {
  const userId = newId();
  const auth = `Bearer ${tokenFor(userId)}`;
  const saveAsIs = () =>
    jest.spyOn(Blog.prototype, 'save').mockImplementation(function () {
      return Promise.resolve(this);
    });

  test('a new post uses the author’s display name, whatever the request says', async () => {
    saveAsIs();
    jest.spyOn(users, 'getDisplayName').mockResolvedValue('Tolga Arslan');
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', auth)
      .send({ title: 'Başlık', content: 'İçerik', author: 'Başka Biri' });
    expect(res.status).toBe(201);
    expect(res.body.author).toBe('Tolga Arslan');
  });

  test('without a display name (accounts from before) a new post is refused with a clear reason', async () => {
    const save = saveAsIs();
    jest.spyOn(users, 'getDisplayName').mockResolvedValue(null);
    const res = await request(app).post('/api/blogs').set('Authorization', auth).send({ title: 'Başlık', content: 'İçerik' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Display name required');
    expect(save).not.toHaveBeenCalled();
  });

  test('editing a post signs it with the current display name; without one it keeps its old author', async () => {
    saveAsIs();
    const existing = () => new Blog({ title: 'Eski', content: 'Eski', author: 'Eski Ad', authorId: userId });
    jest.spyOn(Blog, 'findOne').mockImplementation(async () => existing());
    const edit = () =>
      request(app)
        .put(`/api/blogs/${newId()}`)
        .set('Authorization', auth)
        .send({ title: 'Yeni', content: 'Yeni', author: 'Başka Biri' });

    jest.spyOn(users, 'getDisplayName').mockResolvedValue('Tolga Arslan');
    expect((await edit()).body.author).toBe('Tolga Arslan');

    users.getDisplayName.mockResolvedValue(null);
    const res = await edit();
    expect(res.status).toBe(200);
    expect(res.body.author).toBe('Eski Ad');
  });
});
