const request = require('supertest');
const app = require('../app');
const Pet = require('../models/Pet');
const Image = require('../models/Image');
const { newId, tokenFor } = require('./helpers');

afterEach(() => jest.restoreAllMocks());

// Ölçüleri başlığında olan küçük bir PNG (sunucu dosyayı açmaz, imzaya ve başlığa bakar)
const pngHead = (width, height) => {
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4, 'ascii');
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ihdr, Buffer.alloc(64)]);
};
const PHOTO = `data:image/png;base64,${pngHead(800, 800).toString('base64')}`;

const userId = newId();
const auth = `Bearer ${tokenFor(userId)}`;
const mockImageCreate = () => jest.spyOn(Image, 'create').mockImplementation(async (doc) => ({ _id: newId(), ...doc }));
const mockPetSave = () =>
  jest.spyOn(Pet.prototype, 'save').mockImplementation(async function save() {
    await this.validate();
    return this;
  });

describe('adding a pet with a photo', () => {
  test('stores the photo and links it to the pet', async () => {
    const create = mockImageCreate();
    mockPetSave();
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', auth)
      .send({ name: 'Pamuk', species: 'kedi', photoData: PHOTO });

    expect(res.status).toBe(201);
    expect(String(create.mock.calls[0][0].ownerId)).toBe(String(userId));
    expect(res.body.photo).toMatch(/^\/api\/images\/[0-9a-f]{24}$/);
    expect(res.body.photoId).toBe(res.body.photo.split('/').pop());
  });

  test('a pet without a name does not store the photo', async () => {
    const create = mockImageCreate();
    const res = await request(app).post('/api/pets').set('Authorization', auth).send({ photoData: PHOTO });
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  test('if saving the pet fails, the stored photo is removed again', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockImageCreate();
    jest.spyOn(Pet.prototype, 'save').mockRejectedValue(new Error('db down'));
    const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', auth)
      .send({ name: 'Pamuk', photoData: PHOTO });
    expect(res.status).toBe(500);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  test('a photo address cannot be given directly', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', auth)
      .send({ name: 'Pamuk', photo: `/api/images/${newId()}` });
    expect(res.status).toBe(400);
  });

  test('photo bombs and other bad files are refused like blog photos', async () => {
    const create = mockImageCreate();
    const bomb = `data:image/png;base64,${pngHead(20000, 20000).toString('base64')}`;
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', auth)
      .send({ name: 'Pamuk', photoData: bomb });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Image dimensions are too large');
    expect(create).not.toHaveBeenCalled();
  });

  test('a large body from someone who is not logged in is refused before it is read', async () => {
    const big = `{"name":"${'a'.repeat(2.9 * 1024 * 1024)}"`; // bozuk JSON: okunsaydı 400 olurdu
    const res = await request(app).post('/api/pets').set('Content-Type', 'application/json').send(big);
    expect(res.status).toBe(401);
  });

  test('pet photos and blog photos share the hourly upload allowance', async () => {
    mockImageCreate();
    mockPetSave();
    const someone = `Bearer ${tokenFor(newId())}`;
    for (let i = 0; i < 20; i += 1) {
      const ok = await request(app)
        .post('/api/pets')
        .set('Authorization', someone)
        .send({ name: 'P', photoData: PHOTO });
      expect(ok.status).toBe(201);
    }
    const blocked = await request(app)
      .post('/api/pets')
      .set('Authorization', someone)
      .send({ name: 'P', photoData: PHOTO });
    expect(blocked.status).toBe(429);
    // Fotoğrafsız evcil dost eklemek etkilenmez
    expect((await request(app).post('/api/pets').set('Authorization', someone).send({ name: 'P' })).status).toBe(201);
  });
});

describe('editing a pet photo', () => {
  const oldPhotoId = newId();
  const existing = (photo = `/api/images/${oldPhotoId}`) =>
    jest
      .spyOn(Pet, 'findOne')
      .mockReturnValue({ select: () => Promise.resolve({ photo, photoId: photo ? oldPhotoId : undefined }) });
  const put = (body) => request(app).put(`/api/pets/${newId()}`).set('Authorization', auth).send(body);
  const echoUpdate = () =>
    jest.spyOn(Pet, 'findOneAndUpdate').mockImplementation(async (filter, update) => {
      const doc = { _id: filter._id, name: 'Pamuk', photo: `/api/images/${oldPhotoId}`, photoId: oldPhotoId };
      Object.assign(doc, update.$set);
      Object.keys(update.$unset || {}).forEach((key) => delete doc[key]);
      return doc;
    });

  test('keeping the photo (or leaving the field out) leaves it alone', async () => {
    existing();
    echoUpdate();
    const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
    expect((await put({ name: 'Pamuk', photo: `/api/images/${oldPhotoId}` })).status).toBe(200);
    expect((await put({ name: 'Pamuk' })).status).toBe(200);
    expect(remove).not.toHaveBeenCalled();
  });

  test('a new photo replaces the old one, which is deleted and not counted against the storage limit', async () => {
    existing();
    const update = echoUpdate();
    mockImageCreate();
    const aggregate = jest.spyOn(Image, 'aggregate').mockResolvedValue([]);
    const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});

    const res = await put({ name: 'Pamuk', photoData: PHOTO });

    expect(res.status).toBe(200);
    expect(res.body.photo).not.toBe(`/api/images/${oldPhotoId}`);
    expect(update.mock.calls[0][2]).toMatchObject({ runValidators: true });
    expect(String(aggregate.mock.calls[0][0][0].$match._id.$ne)).toBe(String(oldPhotoId));
    expect(String(remove.mock.calls[0][0]._id)).toBe(String(oldPhotoId));
  });

  test('removing the photo unsets it and deletes the stored file', async () => {
    existing();
    const update = echoUpdate();
    const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
    const res = await put({ name: 'Pamuk', photo: '' });
    expect(res.status).toBe(200);
    expect(update.mock.calls[0][1].$unset).toEqual({ photo: 1, photoId: 1 });
    expect(res.body.photo).toBeUndefined();
    expect(String(remove.mock.calls[0][0]._id)).toBe(String(oldPhotoId));
  });

  test("pointing at someone else's photo is refused", async () => {
    existing();
    const res = await put({ name: 'Pamuk', photo: `/api/images/${newId()}` });
    expect(res.status).toBe(400);
  });

  test('editing a pet that is not yours stores nothing', async () => {
    jest.spyOn(Pet, 'findOne').mockReturnValue({ select: () => Promise.resolve(null) });
    const create = mockImageCreate();
    const res = await put({ name: 'Pamuk', photoData: PHOTO });
    expect(res.status).toBe(404);
    expect(create).not.toHaveBeenCalled();
  });
});

test('deleting a pet deletes its photo', async () => {
  const photoId = newId();
  jest.spyOn(Pet, 'findOneAndDelete').mockResolvedValue({ _id: newId(), photoId });
  const remove = jest.spyOn(Image, 'deleteOne').mockResolvedValue({});
  const res = await request(app).delete(`/api/pets/${newId()}`).set('Authorization', auth);
  expect(res.status).toBe(200);
  expect(String(remove.mock.calls[0][0]._id)).toBe(String(photoId));
});
