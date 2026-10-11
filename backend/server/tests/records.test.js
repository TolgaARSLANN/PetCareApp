const request = require('supertest');
const app = require('../app');
const Pet = require('../models/Pet');
const { newId, tokenFor } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

// Veritabanına gitmeden gerçek bir Pet dokümanı kullanır; save() şema doğrulamasını çalıştırır
const mockPet = (ownerId, extra = {}) => {
  const pet = new Pet({ name: 'Pamuk', species: 'kedi', ownerId, ...extra });
  jest.spyOn(pet, 'save').mockImplementation(async function save() {
    await this.validate();
    return this;
  });
  const findOne = jest.spyOn(Pet, 'findOne').mockResolvedValue(pet);
  return { pet, findOne };
};

describe('record edit and delete routes', () => {
  test('update a health record and return the updated list', async () => {
    const userId = newId();
    const { pet, findOne } = mockPet(userId, {
      healthRecords: [{ date: '2026-03-10', notes: 'Genel kontrol' }],
    });
    const recordId = pet.healthRecords[0]._id;

    const res = await request(app)
      .put(`/api/pets/${pet._id}/health-records/${recordId}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ notes: 'Genel kontrol, aşı yapıldı', ownerId: newId() });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].notes).toBe('Genel kontrol, aşı yapıldı');
    // Sahiplik kontrolü sorguda yapılır
    expect(String(findOne.mock.calls[0][0].ownerId)).toBe(String(userId));
    // Düzenlenemeyen alanlar (ör. ownerId) yok sayılır
    expect(String(pet.ownerId)).toBe(String(userId));
  });

  test('clearing an optional field removes it', async () => {
    const userId = newId();
    const { pet } = mockPet(userId, {
      medicationRecords: [{ name: 'Probiyotik', dosage: '1 ölçek', endDate: '2026-09-09' }],
    });
    const recordId = pet.medicationRecords[0]._id;

    const res = await request(app)
      .put(`/api/pets/${pet._id}/medications/${recordId}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ endDate: '' });

    expect(res.status).toBe(200);
    expect(res.body[0].endDate).toBeUndefined();
    expect(res.body[0].name).toBe('Probiyotik');
  });

  test('emptying a required field returns 400', async () => {
    const userId = newId();
    const { pet } = mockPet(userId, { healthRecords: [{ date: '2026-03-10', notes: 'Not' }] });

    const res = await request(app)
      .put(`/api/pets/${pet._id}/health-records/${pet.healthRecords[0]._id}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ notes: '' });

    expect(res.status).toBe(400);
  });

  test('delete a record and return the remaining list', async () => {
    const userId = newId();
    const { pet } = mockPet(userId, {
      weightHistory: [
        { date: '2026-06-01', weight: 4.2 },
        { date: '2026-08-01', weight: 4.5 },
      ],
    });
    const [first, second] = pet.weightHistory;

    const res = await request(app)
      .delete(`/api/pets/${pet._id}/weight/${first._id}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(String(second._id));
  });

  test('an unknown record id returns 404', async () => {
    const userId = newId();
    const { pet } = mockPet(userId);

    const res = await request(app)
      .delete(`/api/pets/${pet._id}/appointments/${newId()}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`);

    expect(res.status).toBe(404);
    expect(pet.save).not.toHaveBeenCalled();
  });

  test('a malformed record id returns 404 without querying the database', async () => {
    const findOne = jest.spyOn(Pet, 'findOne');
    const res = await request(app)
      .put(`/api/pets/${newId()}/emergency-contact/not-an-id`)
      .set('Authorization', `Bearer ${tokenFor(newId())}`)
      .send({ name: 'X' });

    expect(res.status).toBe(404);
    expect(findOne).not.toHaveBeenCalled();
  });

  test("another user's pet is not found", async () => {
    jest.spyOn(Pet, 'findOne').mockResolvedValue(null);
    const res = await request(app)
      .delete(`/api/pets/${newId()}/health-records/${newId()}`)
      .set('Authorization', `Bearer ${tokenFor(newId())}`);

    expect(res.status).toBe(404);
  });

  test('add a vaccine', async () => {
    const userId = newId();
    const { pet } = mockPet(userId);

    const res = await request(app)
      .post(`/api/pets/${pet._id}/vaccines`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ vaccineName: '  Kuduz ', vaccineDate: '2026-09-01', nextDueDate: '2027-09-01', notes: 'Sol omuz' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].vaccineName).toBe('Kuduz');
    expect(res.body[0].nextDueDate).toBe('2027-09-01T00:00:00.000Z');
  });

  test('a vaccine without a name or date is rejected', async () => {
    const userId = newId();
    const { pet } = mockPet(userId);

    const res = await request(app)
      .post(`/api/pets/${pet._id}/vaccines`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ vaccineName: 'Kuduz' });

    expect(res.status).toBe(400);
  });

  test('edit a vaccine and clear its due date', async () => {
    const userId = newId();
    const { pet } = mockPet(userId, {
      vaccines: [{ vaccineName: 'Karma', vaccineDate: '2026-01-10', nextDueDate: '2027-01-10' }],
    });

    const res = await request(app)
      .put(`/api/pets/${pet._id}/vaccines/${pet.vaccines[0]._id}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ vaccineName: 'Karma (DHPPi)', nextDueDate: '' });

    expect(res.status).toBe(200);
    expect(res.body[0].vaccineName).toBe('Karma (DHPPi)');
    expect(res.body[0].nextDueDate).toBeUndefined();
  });

  test('require a token', async () => {
    const res = await request(app).delete(`/api/pets/${newId()}/weight/${newId()}`);
    expect(res.status).toBe(401);
  });
});
