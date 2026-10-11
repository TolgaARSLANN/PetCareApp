import React, { useEffect, useRef } from "react";
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GuestOnly, RequireAuth } from "./components/RouteGuards";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import PetList from "./components/PetList";
import PetDetails from "./components/PetDetails";
import BlogList from "./components/BlogList";
import BlogDetails from "./components/BlogDetails";
import BlogEditForm from "./components/BlogEditForm";
import AboutUs from "./components/AboutUs";
import Account from "./components/Account";
import Login from "./components/Login";
import Register from "./components/Register";
import NotFound from "./components/NotFound";

// Sayfa değişince en üste kaydır ve odağı içeriğe taşı (klavye / ekran okuyucu kullanıcıları için)
const RouteChangeHandler = () => {
  const { pathname } = useLocation();
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
};

// Her sayfada ortak çerçeve: menü, içerik ve alt bilgi
const Layout = () => (
  <>
    <RouteChangeHandler />
    <a href="#main" className="skip-link">
      İçeriğe geç
    </a>
    <Navbar />
    <main id="main" tabIndex={-1}>
      <Outlet />
    </main>
    <Footer />
  </>
);

// Veri yönlendiricisi (createBrowserRouter): kaydedilmemiş değişiklik uyarısı (useBlocker) bunu gerektirir
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      {
        path: "/login",
        element: (
          <GuestOnly>
            <Login />
          </GuestOnly>
        ),
      },
      {
        path: "/register",
        element: (
          <GuestOnly>
            <Register />
          </GuestOnly>
        ),
      },
      {
        path: "/pets",
        element: (
          <RequireAuth>
            <PetList />
          </RequireAuth>
        ),
      },
      {
        path: "/pets/:id",
        element: (
          <RequireAuth>
            <PetDetails />
          </RequireAuth>
        ),
      },
      { path: "/blogs", element: <BlogList /> },
      { path: "/blogs/:id", element: <BlogDetails /> },
      {
        path: "/blogs/edit/:id",
        element: (
          <RequireAuth>
            <BlogEditForm />
          </RequireAuth>
        ),
      },
      {
        path: "/account",
        element: (
          <RequireAuth>
            <Account />
          </RequireAuth>
        ),
      },
      { path: "/about-us", element: <AboutUs /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const App = () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

export default App;
