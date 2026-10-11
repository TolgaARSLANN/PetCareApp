// Tarih ve metin biçimlendirme yardımcıları (tüm arayüzde aynı görünüm için)

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Takvim günleri (doğum, kayıt, aşı, randevu tarihleri) formdan "2026-03-10" olarak gelir ve sunucuda
// o günün UTC gece yarısı olarak saklanır. Yerel saate çevrilirse UTC'nin gerisindeki ülkelerde bir
// önceki güne kayar; bu yüzden UTC yıl/ay/gün okunup yerel gece yarısı olarak kurulur.
export const calendarDay = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

// Bir anın (ör. "şimdi") yerel gününün başlangıcı
export const localDay = (moment = new Date()) => {
  const d = new Date(moment);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Takvim günü: "10 Mart 2026" (her saat diliminde aynı gün)
export const formatDate = (value) => {
  const day = calendarDay(value);
  return day ? dateFormatter.format(day) : "-";
};

// Kilo: Türkçe ondalık virgülüyle, en fazla 2 basamak ("4,25 kg"). Kilo gösterilen her yerde kullanılır.
const kgFormatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
export const formatKg = (value) => `${kgFormatter.format(value)} kg`;

// Gerçek bir an (ör. blog yazısının yayınlandığı zaman): okuyucunun yerel günüyle gösterilir
export const formatTimestamp = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
};

export const capitalizeTr = (text = "") =>
  text ? text.charAt(0).toLocaleUpperCase("tr-TR") + text.slice(1) : "";

// "2 yaşında", "5 aylık" gibi okunabilir yaş metni
export const petAge = (birthDate) => {
  const birth = calendarDay(birthDate);
  if (!birth) return null;
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return null;
  if (months < 1) return "1 aylıktan küçük";
  if (months < 12) return `${months} aylık`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} yaş ${rest} ay` : `${years} yaşında`;
};

// Tarihe göre yeniden eskiye sıralı kopya
export const sortByDateDesc = (items = [], key = "date") =>
  [...items].sort((a, b) => new Date(b[key] || 0) - new Date(a[key] || 0));

// Kayıttaki ISO tarihini <input type="date"> değerine çevirir ("2026-03-10T00:00:00Z" -> "2026-03-10")
export const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

// <input type="date"> için bugünün tarihi (yerel saat)
export const todayInputValue = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
