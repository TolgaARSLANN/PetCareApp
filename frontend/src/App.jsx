import React, { lazy, Suspense, useEffect, useRef } from "react";
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GuestOnly, RequireAuth } from "./components/RouteGuards";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { PageLoader } from "./components/ui/Loading";
import RouteError from "./components/RouteError";
// İlk açılışta gerekenler (ana sayfa, giriş, kayıt) ana pakette gelir
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import NotFound from "./components/NotFound";

// Diğer sayfalar ayrı dosyalara bölünür ve yalnızca açıldıklarında indirilir
const PetList = lazy(() => import("./components/PetList"));
const PetDetails = lazy(() => import("./components/PetDetails"));
const BlogList = lazy(() => import("./components/BlogList"));
const BlogDetails = lazy(() => import("./components/BlogDetails"));
const BlogEditForm = lazy(() => import("./components/BlogEditForm"));
const AboutUs = lazy(() => import("./components/AboutUs"));
const Account = lazy(() => import("./components/Account"));
const Privacy = lazy(() => import("./components/Privacy"));
const Terms = lazy(() => import("./components/Terms"));

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
      <Suspense fallback={<PageLoader label="Sayfa yükleniyor" />}>
        <Outlet />
      </Suspense>
    </main>
    <Footer />
  </>
);

// Veri yönlendiricisi (createBrowserRouter): kaydedilmemiş değişiklik uyarısı (useBlocker) bunu gerektirir
const routes = [
  {
    element: <Layout />,
    // Çerçevenin kendisi (menü, alt bilgi) hata verirse son çare
    errorElement: <RouteError />,
    children: [
      {
        // Sayfalardaki hatalar burada yakalanır: menü ve alt bilgi yerinde kalır
        errorElement: <RouteError />,
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
          { path: "/privacy", element: <Privacy /> },
          { path: "/terms", element: <Terms /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

const App = () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

export default App;
