import React from "react";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

// Uygulamadaki gibi veri yönlendiricisiyle çizer (useBlocker gibi kancalar bunu gerektirir).
// routes: [{ path, element }], wrapper: ör. AuthProvider
export const renderWithRouter = (routes, { initialEntries = [routes[0].path], wrapper: Wrapper } = {}) => {
  const router = createMemoryRouter(routes, { initialEntries });
  const tree = <RouterProvider router={router} />;
  return { router, ...render(Wrapper ? <Wrapper>{tree}</Wrapper> : tree) };
};
