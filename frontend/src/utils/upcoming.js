// "Yaklaşanlar" paneli: tüm evcil dostların yaklaşan randevuları ve aşı tekrarları.
// Aşı kuralları utils/vaccines.js ile aynıdır (her aşının yalnızca en son kaydı sayılır).
import { calendarDay, localDay } from "./format";
import { latestVaccines, vaccineStatus } from "./vaccines";

const DAY_MS = 24 * 60 * 60 * 1000;

// Bugünden itibaren kaç gün sonra (geçmiş için negatif)
export const daysFromToday = (value, now = new Date()) =>
  Math.round((calendarDay(value) - localDay(now)) / DAY_MS);

export const relativeDay = (value, now = new Date()) => {
  const days = daysFromToday(value, now);
  if (days < 0) return days === -1 ? "Dün" : `${-days} gün önce`;
  if (days === 0) return "Bugün";
  if (days === 1) return "Yarın";
  if (days < 14) return `${days} gün sonra`;
  return `${Math.round(days / 7)} hafta sonra`;
};

// Yaklaşan randevular (bugün dahil) + geciken ya da 30 gün içinde gelen aşı tekrarları.
// Sıralama: önce gecikenler, sonra en yakın tarih.
export const buildUpcoming = (pets = [], now = new Date()) => {
  const today = localDay(now);
  const items = [];

  pets.forEach((pet) => {
    (pet.appointments || []).forEach((app) => {
      if (!app.date || calendarDay(app.date) < today) return;
      items.push({
        key: `app-${pet._id}-${app._id || app.date}`,
        type: "appointment",
        date: app.date,
        time: app.time || "",
        title: app.reason || "Veteriner randevusu",
        location: app.location || "",
        petId: pet._id,
        petName: pet.name,
        overdue: false,
      });
    });

    latestVaccines(pet.vaccines).forEach((vaccine) => {
      const status = vaccineStatus(vaccine, pet.vaccines, now);
      if (status !== "overdue" && status !== "due-soon") return;
      items.push({
        key: `vac-${pet._id}-${vaccine._id || vaccine.vaccineName}`,
        type: "vaccine",
        date: vaccine.nextDueDate,
        time: "",
        title: `${vaccine.vaccineName} aşısı tekrarı`,
        location: "",
        petId: pet._id,
        petName: pet.name,
        overdue: status === "overdue",
      });
    });
  });

  return items.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    const byDate = calendarDay(a.date) - calendarDay(b.date);
    return byDate || (a.time || "99:99").localeCompare(b.time || "99:99");
  });
};
