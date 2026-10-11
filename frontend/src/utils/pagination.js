// Sayfa düğmeleri: ilk, son ve geçerli sayfanın iki yanı her zaman görünür;
// aradaki boşluklar "gap" ile gösterilir. Tek sayfalık boşluk ise numarayla doldurulur.
// pageItems(5, 10) → [1, "gap", 4, 5, 6, "gap", 10]
export const pageItems = (current, total) => {
  if (total <= 1) return [];
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items = [];
  sorted.forEach((page, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && page - prev === 2) items.push(prev + 1);
    else if (prev !== undefined && page - prev > 2) items.push("gap");
    items.push(page);
  });
  return items;
};

// Adres çubuğundaki ?page değerini güvenli bir sayfa numarasına çevirir
export const parsePage = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : 1;
};
