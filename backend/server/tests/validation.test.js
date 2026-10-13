const request = require('supertest');
const app = require('../app');
const Pet = require('../models/Pet');
const Blog = require('../models/Blog');
const User = require('../models/User');
const { newId, tokenFor } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

// Veritabanına gitmeden gerçek bir Pet dokümanı kullanır; save() şema doğrulamasını çalıştırır
const mockPet = (ownerId) => {
  const pet = new Pet({ name: 'Pamuk', species: 'kedi', ownerId });
  jest.spyOn(pet, 'save').mockImplementation(async function save() {
    await this.validate();
    return this;
  });
  jest.spyOn(Pet, 'findOne').mockResolvedValue(pet);
  return pet;
};

const errorsOf = (doc) => Object.keys(doc.validateSync()?.errors || {});

describe('pet model rules', () => {
  const ownerId = newId();

  test('a name made only of spaces counts as empty', () => {
    expect(errorsOf(new Pet({ name: '   ', ownerId }))).toContain('name');
    expect(new Pet({ name: '  Pamuk ', ownerId }).name).toBe('Pamuk');
  });

  test('birth date cannot be in the future', () => {
    expect(errorsOf(new Pet({ name: 'A', ownerId, birthDate: '2999-01-01' }))).toContain('birthDate');
    expect(errorsOf(new Pet({ name: 'A', ownerId, birthDate: '2020-01-01' }))).toEqual([]);
  });

  test('weight must be a positive number', () => {
    const errors = (weight) => errorsOf(new Pet({ name: 'A', ownerId, weightHistory: [{ weight }] }));
    expect(errors(-5)).toContain('weightHistory.0.weight');
    expect(errors(0)).toContain('weightHistory.0.weight');
    expect(errors(undefined)).toContain('weightHistory.0.weight');
    expect(errors(501)).toContain('weightHistory.0.weight');
    expect(errors(4.2)).toEqual([]);
  });

  test('required record fields: medication name and dosage, contact name and phone, appointment date', () => {
    const errors = errorsOf(
      new Pet({ name: 'A', ownerId, medicationRecords: [{}], emergencyContacts: [{}], appointments: [{}] })
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        'medicationRecords.0.name',
        'medicationRecords.0.dosage',
        'emergencyContacts.0.name',
        'emergencyContacts.0.phone',
        'appointments.0.date',
      ])
    );
  });

  test('text fields have length limits', () => {
    const long = 'a'.repeat(2001);
    expect(errorsOf(new Pet({ name: 'A', ownerId, healthRecords: [{ date: new Date(), notes: long }] }))).toContain(
      'healthRecords.0.notes'
    );
  });
});

describe('invalid data is a 400, not a 500', () => {
  const userId = newId();
  const auth = `Bearer ${tokenFor(userId)}`;
  const post = (path, body) => request(app).post(`/api/pets/${newId()}/${path}`).set('Authorization', auth).send(body);

  test.each([
    ['health-records', { date: '2026-01-01' }],
    ['health-records', { date: '2026-01-01', notes: '   ' }],
    ['weight', { date: '2026-01-01', weight: 'abc' }],
    ['weight', { date: '2026-01-01', weight: -5 }],
    ['medications', {}],
    ['appointments', { date: 'not-a-date' }],
    ['emergency-contact', {}],
  ])('POST %s %j', async (path, body) => {
    mockPet(userId);
    const res = await post(path, body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid record data' });
  });

  test('a new pet without a name or with a bad birth date', async () => {
    jest.spyOn(Pet.prototype, 'save').mockImplementation(async function save() {
      await this.validate();
      return this;
    });
    const create = (body) => request(app).post('/api/pets').set('Authorization', auth).send(body);
    expect((await create({ species: 'kedi' })).status).toBe(400);
    expect((await create({ name: 'A', birthDate: 'not-a-date' })).status).toBe(400);
    expect((await create({ name: 'A', birthDate: '2999-01-01' })).status).toBe(400);
  });
});

describe('PUT /api/pets/:id', () => {
  test('runs the model rules, so an empty name cannot break the pet', async () => {
    jest.spyOn(Pet, 'findOne').mockReturnValue({ select: () => Promise.resolve({ photo: undefined }) });
    const update = jest.spyOn(Pet, 'findOneAndUpdate').mockResolvedValue({});
    const userId = newId();
    await request(app)
      .put(`/api/pets/${newId()}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ name: '   ' });
    expect(update.mock.calls[0][2]).toMatchObject({ runValidators: true });
  });
});

describe('blog limits', () => {
  test('title, author and content are trimmed and length-limited', () => {
    const blog = (extra) => new Blog({ title: 'T', content: 'C', author: 'A', authorId: newId(), ...extra });
    expect(errorsOf(blog({ title: 'a'.repeat(121) }))).toContain('title');
    expect(errorsOf(blog({ author: 'a'.repeat(61) }))).toContain('author');
    expect(errorsOf(blog({ title: '   ' }))).toContain('title');
    expect(errorsOf(blog({}))).toEqual([]);
  });
});

describe('emails are case-insensitive', () => {
  test('register stores the email in lower case and checks duplicates that way', async () => {
    const findOne = jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(User, 'create').mockResolvedValue({});
    const res = await request(app).post('/api/auth/register').send({ email: ' Ali@Mail.COM ', password: '123456', displayName: 'Ali', acceptTerms: true });
    expect(res.status).toBe(201);
    expect(findOne).toHaveBeenCalledWith({ email: 'ali@mail.com' });
    expect(create.mock.calls[0][0].email).toBe('ali@mail.com');
  });

  test('login finds the account whatever the letter case', async () => {
    const findOne = jest.spyOn(User, 'findOne').mockResolvedValue(null);
    await request(app).post('/api/auth/login').send({ email: 'ALI@mail.com', password: 'x' });
    expect(findOne).toHaveBeenCalledWith({ email: 'ali@mail.com' });
  });

  test('the model lower-cases emails too', () => {
    expect(new User({ email: 'Ali@Mail.com', password: 'x' }).email).toBe('ali@mail.com');
  });
});

describe('unknown API routes', () => {
  test('answer with JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
