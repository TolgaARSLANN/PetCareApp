// server/models/Pet.js

const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  species: { type: String, default: 'kedi' },
  birthDate: Date,
  vaccines: [
    {
      vaccineName: String,
      vaccineDate: Date,
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
      weight: Number, // Gram veya kilogram cinsinden tutabilirsiniz.
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
