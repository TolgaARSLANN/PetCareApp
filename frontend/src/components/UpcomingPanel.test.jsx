import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UpcomingPanel from "./UpcomingPanel";

const appointment = (i) => ({ _id: `a${i}`, date: `2026-10-${String(12 + i).padStart(2, "0")}`, reason: `Kontrol ${i}` });

const renderPanel = (pets) =>
  render(
    <MemoryRouter>
      <UpcomingPanel pets={pets} />
    </MemoryRouter>
  );

describe("UpcomingPanel", () => {
  beforeEach(() => {
    // Yalnızca Date sahte; userEvent'in zamanlayıcıları gerçek kalır
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-11T12:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  test("links each item to its pet and shows overdue boosters first", () => {
    renderPanel([
      {
        _id: "p1",
        name: "Pamuk",
        appointments: [{ _id: "a1", date: "2026-10-12", time: "10:00", reason: "Genel kontrol", location: "Klinik" }],
        vaccines: [{ _id: "v1", vaccineName: "Kuduz", vaccineDate: "2025-09-01", nextDueDate: "2026-09-01" }],
      },
    ]);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveTextContent("Kuduz aşısı tekrarı");
    expect(links[0]).toHaveTextContent("Gecikti");
    expect(links[0]).toHaveAttribute("href", "/pets/p1");
    expect(links[1]).toHaveTextContent("Genel kontrol");
    expect(links[1]).toHaveTextContent("Yarın");
    expect(screen.getByText(/1 gecikmiş aşı/)).toBeInTheDocument();
  });

  test("shows five items and expands to all", async () => {
    const user = userEvent.setup();
    renderPanel([{ _id: "p1", name: "Pamuk", appointments: Array.from({ length: 7 }, (_, i) => appointment(i)) }]);

    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("link")).toHaveLength(5);

    const toggle = screen.getByRole("button", { name: /Tümünü göster \(7\)/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);

    expect(within(list).getAllByRole("link")).toHaveLength(7);
    expect(screen.getByRole("button", { name: /Daha az göster/ })).toHaveAttribute("aria-expanded", "true");
  });

  test("says so when nothing is coming up", () => {
    renderPanel([{ _id: "p1", name: "Pamuk", appointments: [{ _id: "a1", date: "2026-01-01" }] }]);
    expect(screen.getByText("Önümüzdeki günlerde randevu ya da aşı tekrarı yok.")).toBeInTheDocument();
  });
});
