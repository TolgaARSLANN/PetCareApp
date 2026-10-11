import { describe, expect, test } from "vitest";
import { nextVaccineDue, vaccineStatus } from "./vaccines";

const NOW = new Date("2026-10-11T12:00:00");

describe("vaccineStatus", () => {
  test("overdue, due soon, up to date and no due date", () => {
    const overdue = { vaccineName: "Kuduz", vaccineDate: "2025-09-01", nextDueDate: "2026-09-01" };
    const soon = { vaccineName: "Karma", vaccineDate: "2025-10-24", nextDueDate: "2026-10-24" };
    const ok = { vaccineName: "Lösemi", vaccineDate: "2026-06-01", nextDueDate: "2027-06-01" };
    const none = { vaccineName: "İç parazit", vaccineDate: "2026-09-01" };
    const all = [overdue, soon, ok, none];

    expect(vaccineStatus(overdue, all, NOW)).toBe("overdue");
    expect(vaccineStatus(soon, all, NOW)).toBe("due-soon");
    expect(vaccineStatus(ok, all, NOW)).toBe("ok");
    expect(vaccineStatus(none, all, NOW)).toBe("none");
  });

  test("a due date of today is not overdue yet", () => {
    const v = { vaccineName: "Kuduz", vaccineDate: "2025-10-11", nextDueDate: "2026-10-11" };
    expect(vaccineStatus(v, [v], NOW)).toBe("due-soon");
  });

  test("an older record of a renewed vaccine is marked renewed", () => {
    const old = { vaccineName: "Kuduz", vaccineDate: "2025-09-01", nextDueDate: "2026-09-01" };
    const renewed = { vaccineName: " kuduz ", vaccineDate: "2026-09-05", nextDueDate: "2027-09-05" };
    expect(vaccineStatus(old, [old, renewed], NOW)).toBe("renewed");
    expect(vaccineStatus(renewed, [old, renewed], NOW)).toBe("ok");
  });
});

describe("nextVaccineDue", () => {
  test("picks the earliest due date among current records", () => {
    const vaccines = [
      { vaccineName: "Kuduz", vaccineDate: "2025-09-01", nextDueDate: "2026-09-01" }, // yenilendi, sayılmaz
      { vaccineName: "Kuduz", vaccineDate: "2026-09-05", nextDueDate: "2027-09-05" },
      { vaccineName: "Karma", vaccineDate: "2025-10-24", nextDueDate: "2026-10-24" },
      { vaccineName: "İç parazit", vaccineDate: "2026-09-01" },
    ];
    expect(nextVaccineDue(vaccines).vaccineName).toBe("Karma");
  });

  test("returns null when nothing is scheduled", () => {
    expect(nextVaccineDue([])).toBeNull();
    expect(nextVaccineDue([{ vaccineName: "X", vaccineDate: "2026-01-01" }])).toBeNull();
  });
});
