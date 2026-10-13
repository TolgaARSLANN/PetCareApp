// Görünen ad: blog yazılarında yazar olarak gösterilen isim. Her hesabın tek bir görünen adı vardır
// ve iki hesap aynı adı alamaz; böylece kimse başkasının adıyla yazı yayınlayamaz.

const MIN_LENGTH = 2;
const MAX_LENGTH = 40;

// Latin harfleri (Türkçe dahil), rakamlar, boşluk ve . ' ’ - _
// Diğer alfabeler kapalı: Kiril "а" ile Latin "a" aynı görünür, bir adı taklit etmeye yarardı.
const ALLOWED = /^[\p{Script=Latin}\p{N} .'’_-]+$/u;
const HAS_LETTER = /\p{Script=Latin}/u;

// Baştaki/sondaki boşluklar atılır, aradaki boşluklar teke indirilir
const normalizeDisplayName = (value) => value.normalize('NFC').trim().replace(/\s+/g, ' ');

// Benzersizlik anahtarı: büyük/küçük harf, boşluk ve noktalama farkı aynı ad sayılır
// ("Tolga Arslan", "TOLGA ARSLAN" ve "tolga.arslan" aynı kişi gibi görünür)
const displayNameKey = (name) => name.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]/gu, '');

// Geçerliyse temizlenmiş adı, değilse null döndürür
const parseDisplayName = (value) => {
  if (typeof value !== 'string') return null;
  const name = normalizeDisplayName(value);
  if (name.length < MIN_LENGTH || name.length > MAX_LENGTH) return null;
  if (!ALLOWED.test(name) || !HAS_LETTER.test(name)) return null;
  return name;
};

module.exports = { MIN_LENGTH, MAX_LENGTH, parseDisplayName, displayNameKey };
