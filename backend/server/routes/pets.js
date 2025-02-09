// server/routes/pets.js

const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const authMiddleware = require('../middleware/authMiddleware');

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
    console.error('Error adding new pet:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Kullanıcının Tüm Petlerini Listeleme (GET)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pets = await Pet.find({ ownerId: req.userId }); // Sadece kendi pet'leri
    res.json(pets);
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Tek Pet'i Getirme (GET /:id)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId }); // Sahiplik kontrolü
    if (!pet) return res.status(404).json({ error: 'Pet not found or unauthorized' });
    res.json(pet);
  } catch (error) {
    console.error('Error fetching pet:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Pet Güncelleme (PUT /:id)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, species, birthDate, vaccines } = req.body;

    // Yalnızca giriş yapan kullanıcının pet'i güncellenebilir
    const updatedPet = await Pet.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId }, // Sahiplik kontrolü
      { name, species, birthDate, vaccines }, // 
      { new: true } // Güncellenmiş dokümanı döndür
    );

    if (!updatedPet) return res.status(404).json({ error: 'Pet not found or unauthorized' });
    res.json(updatedPet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error deleting pet:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error adding health record:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error fetching health records:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error adding weight record:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error fetching weight history:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error adding medication record:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error fetching medication records:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error adding appointment:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error adding emergency contact:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Öneri sistemi (GET /:id/recommendations)
router.get('/:id/recommendations', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    const recommendations = [];

    // Pet türüne göre öneriler
    if (pet.species === 'kedi') {
      recommendations.push(
        'Tüy Toplama Tarağı',
        'Kedi Oyuncağı',
        'Tüy Dökülmesini Azaltan Özel Kedi Mamaları',
        'Kedi Tırmalama Tahtası'
      );
    } else if (pet.species === 'köpek') {
      recommendations.push(
        'Diş Temizleme Çubuğu',
        'Köpek Eğitim Oyuncağı',
        'Eklem Destekleyici Vitaminler',
        'Yüksek Proteinli Mamalar'
      );
    } else if (pet.species === 'kuş') {
      recommendations.push(
        'Vitaminli Kuş Yemi',
        'Tüy Parlatıcı Sprey',
        'Salıncak ve Oyuncak Çeşitleri',
        'Kafes Temizlik Malzemeleri'
      );
    }

    // Ağırlık durumuna göre öneriler
    if (pet.weightHistory && pet.weightHistory.length > 0) {
      const latestWeight =
        pet.weightHistory[pet.weightHistory.length - 1].weight;
        if (latestWeight > 10) {
          recommendations.push('Düşük Kalorili Diyet Ürünleri', 'Düzenli Egzersiz Programı');
        } else if (latestWeight < 2) {
          recommendations.push('Yüksek Kalorili Enerji Mamaları', 'Veteriner Beslenme Takviyesi');
        }
      } else {
        recommendations.push('Düzenli Ağırlık Takibi için Dijital Tartı');
      }
  
      // Sağlık kayıtlarına göre öneriler
      if (pet.healthRecords && pet.healthRecords.length > 0) {
        const latestRecord = pet.healthRecords[pet.healthRecords.length - 1];
        recommendations.push(
          `Son sağlık kontrolü notlarına dikkat edin: ${latestRecord.notes}`
        );
      } else {
        recommendations.push('Düzenli Sağlık Kontrolleri Planlayın');
      }
  
      // Randevulara göre öneriler
      if (pet.appointments && pet.appointments.length > 0) {
        recommendations.push('Randevu Hatırlatma Uygulaması');
      }
  
      // İlaç kullanımına göre öneriler
      if (pet.medicationRecords && pet.medicationRecords.length > 0) {
        recommendations.push('İlaç Takibi için Hatırlatma Uygulaması');
      } else {
        recommendations.push('Veteriner Tavsiyeli İlaç Kullanımına Dikkat Edin');
      }
  
      // Acil durum kontakları
      if (!pet.emergencyContacts || pet.emergencyContacts.length === 0) {
        recommendations.push(
          'Acil Durum İçin Bir Veteriner veya Yakın Kişi Ekleyin'
        );
      }
  
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

module.exports = router;
