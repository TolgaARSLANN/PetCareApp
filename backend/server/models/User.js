const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Oturum sürümü: her token bu numarayı taşır. Artırılınca (parola değişimi, "tüm cihazlardan çık")
  // daha önce verilmiş tüm token'lar geçersiz olur.
  tokenVersion: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', userSchema);
