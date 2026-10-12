import React from "react";
import { describe, expect, test } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import PetAvatar from "./PetAvatar";

describe("PetAvatar", () => {
  test("shows the pet's photo when it has one", () => {
    const { container } = render(<PetAvatar pet={{ name: "Pamuk", species: "kedi", photo: "/api/images/abc" }} />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/api/images/abc");
    expect(container.querySelector(".avatar")).toHaveClass("avatar-photo");
  });

  test("shows the species icon without a photo", () => {
    const { container } = render(<PetAvatar pet={{ name: "Pamuk", species: "kedi" }} large />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector(".avatar")).toHaveClass("avatar-lg", "avatar-kedi");
  });

  test("falls back to the icon if the photo cannot be loaded", () => {
    const { container } = render(<PetAvatar pet={{ name: "Pamuk", species: "kedi", photo: "/api/images/gone" }} />);
    fireEvent.error(container.querySelector("img"));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
