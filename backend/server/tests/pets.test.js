const request = require('supertest');
const app = require('../app');
const Pet = require('../models/Pet');
const { newId, tokenFor } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

describe('pet routes', () => {
  test('require a token', async () => {
    const res = await request(app).get('/api/pets');
    expect(res.status).toBe(401);
  });

  test('only query pets owned by the logged-in user', async () => {
    const userId = newId();
    const find = jest.spyOn(Pet, 'find').mockResolvedValue([]);
    const res = await request(app).get('/api/pets').set('Authorization', `Bearer ${tokenFor(userId)}`);
    expect(res.status).toBe(200);
    expect(String(find.mock.calls[0][0].ownerId)).toBe(String(userId));
  });

  test('a malformed id returns 404 without querying the database', async () => {
    const findOne = jest.spyOn(Pet, 'findOne');
    const res = await request(app).get('/api/pets/not-an-id').set('Authorization', `Bearer ${tokenFor(newId())}`);
    expect(res.status).toBe(404);
    expect(findOne).not.toHaveBeenCalled();
  });

  test('species is stored lower-cased', () => {
    const pet = new Pet({ name: 'Pamuk', species: '  Kedi ', ownerId: newId() });
    expect(pet.species).toBe('kedi');
  });
});
