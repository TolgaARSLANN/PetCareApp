// server/models/Pet.js

const mongoose = require('mongoose');

// Metin sınırları: formlardaki maxLength değerleriyle aynı (frontend/src/components)
const SHORT_TEXT = 100;
const LONG_TEXT = 2000;
const MAX_WEIGHT_KG = 500;

// Metin alanı: baştaki/sondaki boşluklar kırpılır, böylece yalnızca boşluktan oluşan değer
// "boş" sayılır ve zorunlu alan kuralına takılır
const text = (maxlength, required = false) => ({ type: String, trim: true, maxlength, required });

// Doğum tarihi gelecekte olamaz (saat dilimi farkları için bir gün pay bırakılır)
const notInFuture = {
  validator: (value) => !value || value.getTime() <= Date.now() + 24 * 60 * 60 * 1000,
  message: 'Date cannot be in the future',
};

const petSchema = new mongoose.Schema({
  name: text(60, true),
  // Öneri sistemi için küçük harfe çevrilir ("Kedi" -> "kedi")
  species: {
    type: String,
    default: 'kedi',
    maxlength: 40,
    set: (v) => (typeof v === 'string' ? v.trim().toLocaleLowerCase('tr-TR') : v),
  },
  birthDate: { type: Date, validate: notInFuture },
  // Evcil dostun fotoğrafı: yalnızca yüklenen fotoğraf (/api/images/<id>, sunucu atar)
  photo: {
    type: String,
    validate: { validator: (v) => !v || /^\/api\/images\/[0-9a-f]{24}$/.test(v), message: 'Invalid photo' },
  },
  // Fotoğrafın kaydı: evcil dost silinince ya da fotoğraf değişince bu kayıt da silinir
  photoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
  vaccines: [
    {
      vaccineName: text(SHORT_TEXT, true),
      vaccineDate: { type: Date, required: true }, // Uygulama tarihi
      nextDueDate: Date, // Tekrar (rapel) tarihi; öneriler ve "sıradaki aşı" bunu kullanır
      notes: text(LONG_TEXT),
    },
  ],
  healthRecords: [
    {
      date: { type: Date, required: true },
      notes: text(LONG_TEXT, true),
    },
  ],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // 1. Ağırlık Takibi
  weightHistory: [
    {
      date: { type: Date, default: Date.now },
      // Kilogram (kg) cinsinden; sıfır ve negatif değerler anlamsız
      weight: {
        type: Number,
        required: true,
        max: MAX_WEIGHT_KG,
        validate: { validator: (v) => v > 0, message: 'Weight must be greater than 0' },
      },
    },
  ],

  // 2. İlaç Kayıtları
  medicationRecords: [
    {
      name: text(SHORT_TEXT, true), // İlacın adı
      dosage: text(SHORT_TEXT, true), // Kullanım dozu
      frequency: text(SHORT_TEXT), // Kullanım sıklığı (günde 2 kez gibi)
      startDate: Date,
      endDate: Date,
      notes: text(LONG_TEXT),
    },
  ],

  // 3. Randevu Yönetimi
  appointments: [
    {
      date: { type: Date, required: true },
      time: text(5), // "SS:DD"
      reason: text(SHORT_TEXT), // Randevu nedeni (kontrol, aşı, vb.)
      location: text(SHORT_TEXT),
    },
  ],

  // 6. Acil Durum Kontakları
  emergencyContacts: [
    {
      name: text(SHORT_TEXT, true),
      relationship: text(SHORT_TEXT), // Örneğin: Veteriner, Arkadaş, Aile...
      phone: text(30, true),
      address: text(LONG_TEXT),
    },
  ],
});

module.exports = mongoose.model('Pet', petSchema);
module.exports.LIMITS = { SHORT_TEXT, LONG_TEXT, MAX_WEIGHT_KG };
