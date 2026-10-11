import React, { useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
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

const App = () => (
  <AuthProvider>
    <Router>
      <RouteChangeHandler />
      <a href="#main" className="skip-link">
        İçeriğe geç
      </a>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="/pets" element={<RequireAuth><PetList /></RequireAuth>} />
          <Route path="/pets/:id" element={<RequireAuth><PetDetails /></RequireAuth>} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blogs/:id" element={<BlogDetails />} />
          <Route path="/blogs/edit/:id" element={<RequireAuth><BlogEditForm /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  </AuthProvider>
);

export default App;
