import React from "react";
import { describe, expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import WeightChart from "./WeightChart";

const RECORDS = [
  { _id: "w3", date: "2026-10-01", weight: 4.4 },
  { _id: "w1", date: "2026-06-01", weight: 4.2 },
  { _id: "w2", date: "2026-08-01", weight: 4.5 },
];

describe("WeightChart", () => {
  test("is not drawn with fewer than two measurements", () => {
    const { container } = render(<WeightChart records={[RECORDS[0]]} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("summarises the range and the overall change", () => {
    render(<WeightChart records={RECORDS} />);
    expect(screen.getByText(/3 ölçüm/)).toHaveTextContent("1 Haziran 2026 – 1 Ekim 2026");
    expect(screen.getByText("+0,2 kg")).toBeInTheDocument();
  });

  test("plots points in date order and labels only the latest value", () => {
    const { container } = render(<WeightChart records={RECORDS} />);
    const dots = [...container.querySelectorAll(".chart-dot")];
    expect(dots).toHaveLength(3);
    const xs = dots.map((d) => Number(d.getAttribute("cx")));
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(container.querySelector(".chart-end-label")).toHaveTextContent("4,4 kg");
  });

  test("can be explored with the keyboard and announces the value", () => {
    render(<WeightChart records={RECORDS} />);
    const chart = screen.getByRole("group", { name: /Kilo grafiği/ });

    fireEvent.focus(chart); // odaklanınca en son ölçüm seçilir
    expect(screen.getByText("4,4 kg, 1 Ekim 2026")).toBeInTheDocument();

    fireEvent.keyDown(chart, { key: "ArrowLeft" });
    expect(screen.getByText("4,5 kg, 1 Ağustos 2026")).toBeInTheDocument();

    fireEvent.keyDown(chart, { key: "Home" });
    expect(screen.getByText("4,2 kg, 1 Haziran 2026")).toBeInTheDocument();

    fireEvent.keyDown(chart, { key: "ArrowLeft" }); // ilk ölçümde kalır
    expect(screen.getByText("4,2 kg, 1 Haziran 2026")).toBeInTheDocument();
  });
});
