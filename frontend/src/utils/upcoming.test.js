import { describe, expect, test } from "vitest";
import { buildUpcoming, daysFromToday, relativeDay } from "./upcoming";

const NOW = new Date("2026-10-11T15:30:00");

describe("relativeDay", () => {
  test("describes days around today", () => {
    expect(relativeDay("2026-10-11", NOW)).toBe("Bugün");
    expect(relativeDay("2026-10-12", NOW)).toBe("Yarın");
    expect(relativeDay("2026-10-14", NOW)).toBe("3 gün sonra");
    expect(relativeDay("2026-10-24", NOW)).toBe("13 gün sonra");
    expect(relativeDay("2026-10-25", NOW)).toBe("2 hafta sonra");
    expect(relativeDay("2026-11-08", NOW)).toBe("4 hafta sonra");
    expect(relativeDay("2026-10-10", NOW)).toBe("Dün");
    expect(relativeDay("2026-09-01", NOW)).toBe("40 gün önce");
  });

  test("reads the stored calendar day (sent by the server as UTC midnight)", () => {
    expect(daysFromToday("2026-10-12T00:00:00.000Z", NOW)).toBe(1);
  });
});

describe("buildUpcoming", () => {
  const pets = [
    {
      _id: "p1",
      name: "Pamuk",
      appointments: [
        { _id: "a1", date: "2026-10-24", time: "14:30", reason: "Kuduz aşısı", location: "Klinik" },
        { _id: "a2", date: "2026-03-10", reason: "Geçmiş kontrol" },
        { _id: "a3", date: "2026-10-11", time: "18:00" },
      ],
      vaccines: [
        { _id: "v1", vaccineName: "Kuduz", vaccineDate: "2025-09-01", nextDueDate: "2026-09-01" },
        { _id: "v2", vaccineName: "Lösemi", vaccineDate: "2026-06-01", nextDueDate: "2027-06-01" },
      ],
    },
    {
      _id: "p2",
      name: "Karamel",
      appointments: [{ _id: "a4", date: "2026-10-11", time: "09:00", reason: "Tırnak kesimi" }],
      vaccines: [{ _id: "v3", vaccineName: "Karma", vaccineDate: "2025-10-20", nextDueDate: "2026-10-20" }],
    },
  ];

  test("lists future appointments and due boosters from every pet, overdue first", () => {
    const items = buildUpcoming(pets, NOW);
    expect(items.map((i) => `${i.petName}: ${i.title}`)).toEqual([
      "Pamuk: Kuduz aşısı tekrarı", // gecikmiş aşı en üstte
      "Karamel: Tırnak kesimi", // bugün 09:00
      "Pamuk: Veteriner randevusu", // bugün 18:00, sebep yazılmamış
      "Karamel: Karma aşısı tekrarı", // 20 Ekim
      "Pamuk: Kuduz aşısı", // 24 Ekim randevusu
    ]);
    expect(items[0].overdue).toBe(true);
  });

  test("leaves out past appointments and boosters further than 30 days away", () => {
    const titles = buildUpcoming(pets, NOW).map((i) => i.title);
    expect(titles).not.toContain("Geçmiş kontrol");
    expect(titles.some((t) => t.startsWith("Lösemi"))).toBe(false);
  });

  test("handles pets without records", () => {
    expect(buildUpcoming([{ _id: "p3", name: "Limon" }], NOW)).toEqual([]);
    expect(buildUpcoming(undefined, NOW)).toEqual([]);
  });
});
