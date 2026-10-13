const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Küçük harfle saklanır: "Ali@Mail.com" ile "ali@mail.com" aynı hesaptır
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  // Oturum sürümü: her token bu numarayı taşır. Artırılınca (parola değişimi, "tüm cihazlardan çık")
  // daha önce verilmiş tüm token'lar geçersiz olur.
  tokenVersion: { type: Number, default: 0 },
  // Blog yazılarında yazar olarak görünen ad (services/displayName.js). Bu özellikten önce açılan
  // hesaplarda yoktur; kullanıcı Hesabım sayfasından belirler.
  displayName: { type: String, trim: true, maxlength: 40 },
  // Benzersizlik için adın sadeleştirilmiş hali (displayNameKey): iki hesap aynı adı alamaz
  displayNameKey: { type: String },
  // Kayıtta "Kullanım Koşulları'nı kabul ediyorum" onayı: ne zaman ve
  // koşulların hangi sürümü (routes/auth.js, TERMS_VERSION). Bu özellikten önce açılan hesaplarda yoktur.
  termsAcceptedAt: { type: Date },
  termsVersion: { type: String },
});

// Görünen adı olmayan eski hesaplar dizine girmez (hepsi "ad yok" diye çakışmasın)
userSchema.index(
  { displayNameKey: 1 },
  { unique: true, partialFilterExpression: { displayNameKey: { $type: 'string' } } }
);

module.exports = mongoose.model('User', userSchema);
