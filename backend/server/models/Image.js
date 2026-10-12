// models/Image.js
// Blog kapak fotoğrafları. Tarayıcıda küçültülüp (en fazla 1600 px, ~150-300 KB) yazıyla birlikte
// gönderilir; yazı kaydedilince saklanır, yazı silinince silinir (sahipsiz fotoğraf kalmaz).
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'image/webp'] },
  size: { type: Number, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Image', imageSchema);
