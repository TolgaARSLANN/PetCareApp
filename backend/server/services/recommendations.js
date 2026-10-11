// services/recommendations.js
// Evcil hayvanın türüne, kilo geçmişine ve kayıtlarına göre öneri listesi üretir.
// Saf bir fonksiyondur (veritabanına erişmez), bu yüzden kolayca test edilebilir.

const SPECIES_PRODUCTS = {
  kedi: [
    'Tüy Toplama Tarağı',
    'Kedi Oyuncağı',
    'Tüy Dökülmesini Azaltan Özel Kedi Mamaları',
    'Kedi Tırmalama Tahtası',
  ],
  köpek: [
    'Diş Temizleme Çubuğu',
    'Köpek Eğitim Oyuncağı',
    'Eklem Destekleyici Vitaminler',
    'Yüksek Proteinli Mamalar',
  ],
  kuş: [
    'Vitaminli Kuş Yemi',
    'Tüy Parlatıcı Sprey',
    'Salıncak ve Oyuncak Çeşitleri',
    'Kafes Temizlik Malzemeleri',
  ],
};

// Yetişkin ev kedisi için kaba kilo aralığı (kg). Köpek ve kuşta ırka göre
// çok değiştiği için sabit eşik kullanılmaz; onlarda yalnızca kilo değişimine bakılır.
const CAT_WEIGHT_RANGE_KG = { min: 2.5, max: 6.5 };

// İki ölçüm arasında bu oranın üzerindeki değişim veteriner kontrolü gerektirir
const SIGNIFICANT_WEIGHT_CHANGE = 0.1;

const normalizeSpecies = (species) =>
  typeof species === 'string' ? species.trim().toLocaleLowerCase('tr-TR') : '';

// Kayıtları tarihe göre eskiden yeniye sıralar. Kayıtlar her zaman tarih sırasıyla
// eklenmez (geçmişe dönük giriş, sonradan tarih düzenleme), bu yüzden "son" kayıt
// listenin sonundaki değil en yeni tarihli olandır. Tarihi olmayan kayıtlar en eski sayılır;
// sıralama kararlı olduğu için eşit tarihlilerde eklenme sırası korunur.
const byDateAsc = (records = []) => {
  const time = (r) => {
    const t = new Date(r.date).getTime();
    return r.date && !Number.isNaN(t) ? t : -Infinity;
  };
  return [...records].sort((a, b) => {
    const ta = time(a);
    const tb = time(b);
    return ta === tb ? 0 : ta < tb ? -1 : 1;
  });
};

// now: testlerde sabit bir "bugün" vermek için
function getRecommendations(pet, now = new Date()) {
  const recommendations = [];
  const species = normalizeSpecies(pet.species);

  // Türe göre ürün önerileri
  if (SPECIES_PRODUCTS[species]) {
    recommendations.push(...SPECIES_PRODUCTS[species]);
  }

  // Kilo durumuna göre öneriler (ağırlıklar kg cinsindendir)
  const weights = byDateAsc(pet.weightHistory).filter((w) => typeof w.weight === 'number');
  if (weights.length === 0) {
    recommendations.push('Düzenli Ağırlık Takibi için Dijital Tartı');
  } else {
    const latest = weights[weights.length - 1].weight;

    if (species === 'kedi') {
      if (latest > CAT_WEIGHT_RANGE_KG.max) {
        recommendations.push('Düşük Kalorili Diyet Ürünleri (veteriner onayıyla)', 'Düzenli Oyun ve Egzersiz');
      } else if (latest < CAT_WEIGHT_RANGE_KG.min) {
        recommendations.push('Yüksek Kalorili Enerji Mamaları (veteriner onayıyla)', 'Veteriner Beslenme Takviyesi');
      }
    }

    if (weights.length >= 2) {
      const previous = weights[weights.length - 2].weight;
      if (previous > 0 && Math.abs(latest - previous) / previous >= SIGNIFICANT_WEIGHT_CHANGE) {
        recommendations.push('Belirgin Kilo Değişimi: Veteriner Kontrolü Önerilir');
      }
    }
  }

  // Sağlık kayıtlarına göre öneriler
  if (pet.healthRecords && pet.healthRecords.length > 0) {
    const latestRecord = byDateAsc(pet.healthRecords).at(-1);
    recommendations.push(`Son sağlık kontrolü notlarına dikkat edin: ${latestRecord.notes}`);
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

  // Acil durum kişileri
  if (!pet.emergencyContacts || pet.emergencyContacts.length === 0) {
    recommendations.push('Acil Durum İçin Bir Veteriner veya Yakın Kişi Ekleyin');
  }

  // Aşılara göre öneriler
  recommendations.push(...vaccineRecommendations(pet.vaccines, now));

  return recommendations;
}

const DUE_SOON_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const formatDateTr = (date) =>
  new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

// Her aşının yalnızca en son yapılan kaydına bakılır: yenilenmiş bir aşının eski kaydındaki
// geçmiş tekrar tarihi uyarı üretmez. Geciken ve 30 gün içinde gelen tekrarlar bildirilir.
function vaccineRecommendations(vaccines = [], now = new Date()) {
  if (vaccines.length === 0) return ['Aşı Takvimini Veterinerinizle Planlayın'];

  const latestByName = new Map();
  vaccines
    // Alanlar açıkça kopyalanır: Mongoose alt dokümanları {...v} ile kopyalanamaz
    .map((v) => ({ vaccineName: v.vaccineName, nextDueDate: v.nextDueDate, date: v.vaccineDate }))
    .forEach((v) => {
      const key = normalizeSpecies(v.vaccineName); // aynı normalizasyon: kırp + Türkçe küçük harf
      const current = latestByName.get(key);
      if (!current || byDateAsc([current, v])[1] === v) latestByName.set(key, v);
    });

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const notes = [];
  latestByName.forEach((v) => {
    if (!v.nextDueDate) return;
    const due = new Date(v.nextDueDate);
    if (Number.isNaN(due.getTime())) return;
    if (due < today) {
      notes.push(`${v.vaccineName} aşısının tekrar tarihi geçti (${formatDateTr(due)}): veterinerinizden randevu alın`);
    } else if (due - today <= DUE_SOON_DAYS * DAY_MS) {
      notes.push(`${v.vaccineName} aşısının tekrar tarihi yaklaşıyor (${formatDateTr(due)})`);
    }
  });
  return notes;
}

module.exports = { getRecommendations, normalizeSpecies };
