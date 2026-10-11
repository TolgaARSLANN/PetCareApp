import { calendarDay, localDay } from "./format";

// Aşı durumları. Backend'deki öneri mantığıyla aynı kurallar
// (backend/server/services/recommendations.js): her aşının yalnızca en son yapılan kaydı
// geçerlidir; yenilenmiş eski kayıtlar "Yenilendi" sayılır ve uyarı üretmez.

export const DUE_SOON_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeName = (name = "") => name.trim().toLocaleLowerCase("tr-TR");
const time = (value) => {
  const t = new Date(value).getTime();
  return value && !Number.isNaN(t) ? t : -Infinity;
};

// Aşı adına göre en son yapılan kayıtlar (Map: normalize ad -> kayıt)
export const latestVaccines = (vaccines = []) => {
  const latest = new Map();
  vaccines.forEach((v) => {
    const key = normalizeName(v.vaccineName);
    const current = latest.get(key);
    if (!current || time(v.vaccineDate) >= time(current.vaccineDate)) latest.set(key, v);
  });
  return latest;
};

// "renewed" | "overdue" | "due-soon" | "ok" | "none"
export const vaccineStatus = (vaccine, allVaccines, now = new Date()) => {
  const latest = latestVaccines(allVaccines).get(normalizeName(vaccine.vaccineName));
  if (latest && latest !== vaccine) return "renewed";
  if (!vaccine.nextDueDate) return "none";
  const due = calendarDay(vaccine.nextDueDate);
  const today = localDay(now);
  if (due < today) return "overdue";
  if (due - today <= DUE_SOON_DAYS * DAY_MS) return "due-soon";
  return "ok";
};

// Sıradaki (en yakın) tekrar: geçerli kayıtlar arasında tekrar tarihi en erken olan
export const nextVaccineDue = (vaccines = []) =>
  [...latestVaccines(vaccines).values()]
    .filter((v) => v.nextDueDate)
    .sort((a, b) => time(a.nextDueDate) - time(b.nextDueDate))[0] || null;

export const VACCINE_STATUS_BADGES = {
  renewed: { label: "Yenilendi", className: "badge-neutral" },
  overdue: { label: "Gecikti", className: "badge-danger" },
  "due-soon": { label: "Yaklaşıyor", className: "badge-warning" },
  ok: { label: "Güncel", className: "badge-success" },
};
