// Grafik için saf hesaplar (DOM'a dokunmaz, kolayca test edilir)

// [min, max] aralığını kapsayan "yuvarlak" eksen değerleri (ör. 4.0, 4.2, 4.4 ...)
export const niceTicks = (min, max, target = 4) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) {
    // Tek değer: değerin çevresinde küçük bir aralık aç
    const pad = Math.abs(min) * 0.05 || 1;
    return niceTicks(min - pad, max + pad, target);
  }
  const rawStep = (max - min) / target;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) || 10 * magnitude;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks = [];
  // Kayan nokta hatalarını önlemek için adım sayısı üzerinden üret ve yuvarla
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  for (let i = 0; start + i * step <= end + step / 1e6; i += 1) {
    ticks.push(Number((start + i * step).toFixed(decimals)));
  }
  return ticks;
};

// Doğrusal ölçek: [d0, d1] -> [r0, r1]; alan sıfır genişlikteyse ortaya yerleştirir
export const linearScale = ([d0, d1], [r0, r1]) => (value) =>
  d1 === d0 ? (r0 + r1) / 2 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);

// Zaman ekseni etiketleri: az ölçüm varsa her ölçüm, çoksa eşit aralıklı en fazla `max` tarih
export const timeTicks = (times, max = 5) => {
  const unique = [...new Set(times)].sort((a, b) => a - b);
  if (unique.length <= max) return unique;
  const first = unique[0];
  const last = unique[unique.length - 1];
  return Array.from({ length: max }, (_, i) => first + ((last - first) * i) / (max - 1));
};

// Aralık bir yılı aşıyorsa ay + yıl, aşmıyorsa gün + ay
export const timeTickFormatter = (times) => {
  const span = Math.max(...times) - Math.min(...times);
  const longRange = span > 330 * 24 * 60 * 60 * 1000;
  const fmt = new Intl.DateTimeFormat("tr-TR", longRange ? { month: "short", year: "numeric" } : { day: "numeric", month: "short" });
  return (t) => fmt.format(new Date(t));
};

export const formatKg = (value) =>
  `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value)} kg`;
