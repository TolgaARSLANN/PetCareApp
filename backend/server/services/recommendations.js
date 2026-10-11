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

function getRecommendations(pet) {
  const recommendations = [];
  const species = normalizeSpecies(pet.species);

  // Türe göre ürün önerileri
  if (SPECIES_PRODUCTS[species]) {
    recommendations.push(...SPECIES_PRODUCTS[species]);
  }

  // Kilo durumuna göre öneriler (ağırlıklar kg cinsindendir)
  const weights = (pet.weightHistory || []).filter((w) => typeof w.weight === 'number');
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
    const latestRecord = pet.healthRecords[pet.healthRecords.length - 1];
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

  return recommendations;
}

module.exports = { getRecommendations, normalizeSpecies };
