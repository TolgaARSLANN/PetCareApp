// server/models/Pet.js

const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Öneri sistemi için küçük harfe çevrilir ("Kedi" -> "kedi")
  species: {
    type: String,
    default: 'kedi',
    set: (v) => (typeof v === 'string' ? v.trim().toLocaleLowerCase('tr-TR') : v),
  },
  birthDate: Date,
  vaccines: [
    {
      vaccineName: { type: String, required: true, trim: true },
      vaccineDate: { type: Date, required: true }, // Uygulama tarihi
      nextDueDate: Date, // Tekrar (rapel) tarihi; öneriler ve "sıradaki aşı" bunu kullanır
      notes: String,
    },
  ],
  healthRecords: [
    {
      date: { type: Date, required: true },
      notes: { type: String, required: true },
    },
  ],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 1. Ağırlık Takibi
  weightHistory: [
    {
      date: { type: Date, default: Date.now },
      weight: Number, // Kilogram (kg) cinsinden
    },
  ],

  // 2. İlaç Kayıtları
  medicationRecords: [
    {
      name: String,        // İlacın adı
      dosage: String,      // Kullanım dozu
      frequency: String,   // Kullanım sıklığı (günde 2 kez gibi)
      startDate: Date,
      endDate: Date,
      notes: String,
    },
  ],

  // 3. Randevu Yönetimi
  appointments: [
    {
      date: Date,
      time: String,   // veya date içerisine saat bilgisi de gömülebilir
      reason: String, // Randevu nedeni (kontrol, aşı, vb.)
      location: String,
    },
  ],

  // 6. Acil Durum Kontakları
  emergencyContacts: [
    {
      name: String,
      relationship: String, // Örneğin: Veteriner, Arkadaş, Aile...
      phone: String,
      address: String,
    },
  ],
});

module.exports = mongoose.model('Pet', petSchema);
