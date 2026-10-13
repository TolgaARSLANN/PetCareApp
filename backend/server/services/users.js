const User = require('../models/User');

// Kullanıcının görünen adı; henüz belirlemediyse (eski hesaplar) null
const getDisplayName = async (userId) => {
  const user = await User.findById(userId).select('displayName').lean();
  return user?.displayName || null;
};

// MongoDB'nin "benzersiz alan zaten var" hatası (aynı anda iki istek aynı adı ya da e-postayı aldığında)
const isDuplicateKey = (err, field) => err?.code === 11000 && Boolean(err.keyPattern?.[field]);

module.exports = { getDisplayName, isDuplicateKey };
