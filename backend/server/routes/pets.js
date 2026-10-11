// server/routes/pets.js

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Pet = require('../models/Pet');
const authMiddleware = require('../middleware/authMiddleware');
const { getRecommendations } = require('../services/recommendations');

// Hatalı veri (eksik zorunlu alan, sayı olmayan kilo, geçersiz tarih...) istemci hatasıdır: 400.
// Yalnızca beklenmeyen hatalar 500 döner ve kaydedilir.
const sendError = (res, error, logMessage) => {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid record data' });
  }
  console.error(logMessage, error);
  return res.status(500).json({ error: 'Server error' });
};

// Geçersiz bir ID gelirse Mongoose CastError (500) yerine 404 dön
router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Pet not found or unauthorized' });
  }
  next();
});

// 1. Yeni Pet Ekleme (POST)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, species, birthDate, vaccines } = req.body;
    const pet = new Pet({
      name,
      species,
      birthDate,
      vaccines: vaccines || [],
      ownerId: req.userId // Giriş yapan kullanıcının ID'si
    });
    await pet.save();
    res.status(201).json(pet);
  } catch (error) {
    sendError(res, error, 'Error adding new pet:');
  }
});

// 2. Kullanıcının Tüm Petlerini Listeleme (GET)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pets = await Pet.find({ ownerId: req.userId }); // Sadece kendi pet'leri
    res.json(pets);
  } catch (error) {
    sendError(res, error, 'Error fetching pets:');
  }
});

// 3. Tek Pet'i Getirme (GET /:id)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId }); // Sahiplik kontrolü
    if (!pet) return res.status(404).json({ error: 'Pet not found or unauthorized' });
    res.json(pet);
  } catch (error) {
    sendError(res, error, 'Error fetching pet:');
  }
});

// 4. Pet Güncelleme (PUT /:id)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, species, birthDate, vaccines } = req.body;

    // Yalnızca giriş yapan kullanıcının pet'i güncellenebilir
    const updatedPet = await Pet.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId }, // Sahiplik kontrolü
      { name, species, birthDate, vaccines },
      // Güncellenmiş dokümanı döndür; model kuralları (ör. boş ad) güncellemede de uygulanır,
      // yoksa geçersiz bir ad kaydı bozar ve sonraki her kayıt eklemesi başarısız olur
      { new: true, runValidators: true }
    );

    if (!updatedPet) return res.status(404).json({ error: 'Pet not found or unauthorized' });
    res.json(updatedPet);
  } catch (error) {
    sendError(res, error, 'Error updating pet:');
  }
});

// 5. Pet Silme (DELETE /:id)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Yalnızca giriş yapan kullanıcının pet'i silinebilir
    const deletedPet = await Pet.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.userId // Sahiplik kontrolü
    });

    if (!deletedPet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    sendError(res, error, 'Error deleting pet:');
  }
});

// 6. Sağlık Kaydı Ekleme (POST /:id/health-records)
router.post('/:id/health-records', authMiddleware, async (req, res) => {
  try {
    const { date, notes } = req.body;

    // Pet'i bul ve sağlık kaydını ekle
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    pet.healthRecords.push({ date, notes });
    await pet.save();

    res.status(201).json(pet);
  } catch (error) {
    sendError(res, error, 'Error adding health record:');
  }
});

// 7. Sağlık Kayıtlarını Listeleme (GET /:id/health-records)
router.get('/:id/health-records', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    res.json(pet.healthRecords);
  } catch (error) {
    sendError(res, error, 'Error fetching health records:');
  }
});

// Ağırlık ekleme (POST /:id/weight)
router.post('/:id/weight', authMiddleware, async (req, res) => {
  try {
    const { date, weight } = req.body;
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    pet.weightHistory.push({ date, weight });
    await pet.save();
    res.status(201).json(pet.weightHistory);
  } catch (error) {
    sendError(res, error, 'Error adding weight record:');
  }
});

// Ağırlık kayıtlarını listeleme (GET /:id/weight)
router.get('/:id/weight', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    res.json(pet.weightHistory);
  } catch (error) {
    sendError(res, error, 'Error fetching weight history:');
  }
});

// Yeni ilaç ekleme (POST /:id/medications)
router.post('/:id/medications', authMiddleware, async (req, res) => {
  try {
    const { name, dosage, frequency, startDate, endDate, notes } = req.body;
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    pet.medicationRecords.push({ name, dosage, frequency, startDate, endDate, notes });
    await pet.save();
    res.status(201).json(pet.medicationRecords);
  } catch (error) {
    sendError(res, error, 'Error adding medication record:');
  }
});

// İlaç kayıtlarını listeleme (GET /:id/medications)
router.get('/:id/medications', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    res.json(pet.medicationRecords);
  } catch (error) {
    sendError(res, error, 'Error fetching medication records:');
  }
});

// Yeni randevu ekleme (POST /:id/appointments)
router.post('/:id/appointments', authMiddleware, async (req, res) => {
  try {
    const { date, time, reason, location } = req.body;
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    pet.appointments.push({ date, time, reason, location });
    await pet.save();
    res.status(201).json(pet.appointments);
  } catch (error) {
    sendError(res, error, 'Error adding appointment:');
  }
});

// Randevu listeleme (GET /:id/appointments)
router.get('/:id/appointments', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    res.json(pet.appointments);
  } catch (error) {
    sendError(res, error, 'Error fetching appointments:');
  }
});


// Aşı ekleme (POST /:id/vaccines)
router.post('/:id/vaccines', authMiddleware, async (req, res) => {
  try {
    const { vaccineName, vaccineDate, nextDueDate, notes } = req.body;
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    pet.vaccines.push({ vaccineName, vaccineDate, nextDueDate: nextDueDate || undefined, notes });
    await pet.save();
    res.status(201).json(pet.vaccines);
  } catch (error) {
    sendError(res, error, 'Error adding vaccine:');
  }
});

// Aşıları listeleme (GET /:id/vaccines)
router.get('/:id/vaccines', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    res.json(pet.vaccines);
  } catch (error) {
    sendError(res, error, 'Error fetching vaccines:');
  }
});

// Acil durum kontaktı ekleme (POST /:id/emergency-contact)
router.post('/:id/emergency-contact', authMiddleware, async (req, res) => {
  try {
    const { name, relationship, phone, address } = req.body;
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    pet.emergencyContacts.push({ name, relationship, phone, address });
    await pet.save();
    res.status(201).json(pet.emergencyContacts);
  } catch (error) {
    sendError(res, error, 'Error adding emergency contact:');
  }
});

// Acil durum kontaklarını listeleme (GET /:id/emergency-contact)
router.get('/:id/emergency-contact', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    res.json(pet.emergencyContacts);
  } catch (error) {
    sendError(res, error, 'Error fetching emergency contacts:');
  }
});

// Kayıt düzenleme ve silme
// PUT    /:id/<tür>/:recordId  -> kaydı günceller, güncel listeyi döndürür
// DELETE /:id/<tür>/:recordId  -> kaydı siler, güncel listeyi döndürür
// Yalnızca aşağıda listelenen alanlar güncellenebilir.
const RECORD_TYPES = {
  'health-records': { field: 'healthRecords', editable: ['date', 'notes'] },
  vaccines: { field: 'vaccines', editable: ['vaccineName', 'vaccineDate', 'nextDueDate', 'notes'] },
  weight: { field: 'weightHistory', editable: ['date', 'weight'] },
  medications: {
    field: 'medicationRecords',
    editable: ['name', 'dosage', 'frequency', 'startDate', 'endDate', 'notes'],
  },
  appointments: { field: 'appointments', editable: ['date', 'time', 'reason', 'location'] },
  'emergency-contact': { field: 'emergencyContacts', editable: ['name', 'relationship', 'phone', 'address'] },
};

const findRecord = async (req, res, { field }) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.recordId)) {
    res.status(404).json({ error: 'Record not found' });
    return {};
  }
  const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
  if (!pet) {
    res.status(404).json({ error: 'Pet not found or unauthorized' });
    return {};
  }
  const record = pet[field].id(req.params.recordId);
  if (!record) {
    res.status(404).json({ error: 'Record not found' });
    return {};
  }
  return { pet, record };
};

Object.entries(RECORD_TYPES).forEach(([path, type]) => {
  router.put(`/:id/${path}/:recordId`, authMiddleware, async (req, res) => {
    try {
      const { pet, record } = await findRecord(req, res, type);
      if (!pet) return;

      type.editable.forEach((key) => {
        if (req.body[key] !== undefined) {
          // Boş bırakılan isteğe bağlı alanlar (ör. bitiş tarihi) temizlenir
          record.set(key, req.body[key] === '' ? undefined : req.body[key]);
        }
      });
      await pet.save();
      res.json(pet[type.field]);
    } catch (error) {
      sendError(res, error, `Error updating ${path} record:`);
    }
  });

  router.delete(`/:id/${path}/:recordId`, authMiddleware, async (req, res) => {
    try {
      const { pet, record } = await findRecord(req, res, type);
      if (!pet) return;

      record.deleteOne();
      await pet.save();
      res.json(pet[type.field]);
    } catch (error) {
      sendError(res, error, `Error deleting ${path} record:`);
    }
  });
});

// Öneri sistemi (GET /:id/recommendations)
router.get('/:id/recommendations', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    res.json(getRecommendations(pet));
  } catch (error) {
    sendError(res, error, 'Error fetching recommendations:');
  }
});

module.exports = router;
