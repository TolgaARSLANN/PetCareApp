// Tüm backend testleri UTC'nin gerisindeki bir saat diliminde çalışır. Takvim günleri UTC gece yarısı
// olarak saklandığı için saat dilimine bağlı kod burada bir gün kayar ve testler bunu yakalar.
// (Saat dilimi test süreçleri başlamadan ayarlanmalı; test içinde process.env.TZ değiştirmek etkisizdir.)
module.exports = () => {
  process.env.TZ = 'America/Los_Angeles';
};
