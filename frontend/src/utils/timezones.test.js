import { afterAll, describe, expect, test, vi } from "vitest";

// Sunucu takvim günlerini UTC gece yarısı olarak saklar ve öyle gönderir
const STORED = "2026-03-10T00:00:00.000Z";
const originalTz = process.env.TZ;

// Modüller her saat diliminde yeniden yüklenir (tarih biçimlendiriciler yüklenirken saat dilimini alır)
const loadIn = async (tz) => {
  process.env.TZ = tz;
  vi.resetModules();
  return {
    format: await import("./format"),
    upcoming: await import("./upcoming"),
    vaccines: await import("./vaccines"),
  };
};

describe.each(["America/Los_Angeles", "America/New_York", "Europe/Istanbul", "Asia/Tokyo"])(
  "stored dates show the same day in %s",
  (tz) => {
    afterAll(() => {
      process.env.TZ = originalTz;
    });

    test("formatDate, petAge and the day counters", async () => {
      const { format, upcoming, vaccines } = await loadIn(tz);
      // Saat dilimi gerçekten değişti mi (testin anlamlı olması için)
      const offset = new Date(2026, 0, 1).getTimezoneOffset();
      expect(tz.startsWith("America") ? offset > 0 : offset < 0).toBe(true);
      expect(format.formatDate(STORED)).toBe("10 Mart 2026");
      expect(format.calendarDay(STORED).getDate()).toBe(10);

      // Yerel saatle 10 Mart akşamı: kayıt "bugün"
      const evening = new Date(2026, 2, 10, 23, 30);
      expect(upcoming.daysFromToday(STORED, evening)).toBe(0);
      expect(upcoming.relativeDay(STORED, evening)).toBe("Bugün");

      // Tekrar tarihi bugün olan aşı gecikmiş sayılmaz
      const vaccine = { vaccineName: "Kuduz", vaccineDate: "2025-03-10T00:00:00.000Z", nextDueDate: STORED };
      expect(vaccines.vaccineStatus(vaccine, [vaccine], evening)).toBe("due-soon");

      // 10 Mart 2025 doğumlu, 10 Mart 2026 itibarıyla 1 yaşında (yaş bugüne göre hesaplanır)
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10, 9, 0));
      expect(format.petAge("2025-03-10T00:00:00.000Z")).toBe("1 yaşında");
      vi.useRealTimers();
    });
  }
);

describe("blog timestamps stay real moments", () => {
  test("formatTimestamp uses the reader's local day", async () => {
    const { format } = await loadIn("Asia/Tokyo");
    // 10 Mart 20:00 UTC = 11 Mart 05:00 Tokyo
    expect(format.formatTimestamp("2026-03-10T20:00:00.000Z")).toBe("11 Mart 2026");
    process.env.TZ = originalTz;
  });
});
