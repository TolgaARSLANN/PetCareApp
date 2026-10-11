import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import PetList from "./components/PetList";
import PetDetails from "./components/PetDetails";
import BlogList from "./components/BlogList";
import BlogDetails from "./components/BlogDetails";
import BlogEditForm from "./components/BlogEditForm";
import AboutUs from "./components/AboutUs";
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

const App = () => {
  // Oturum durumu ilk render'da okunur; böylece sayfa yenilenince login'e kısa yönlendirme olmaz
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));

  return (
    <Router>
      <RouteChangeHandler />
      <a href="#main" className="skip-link">
        İçeriğe geç
      </a>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/pets" /> : <Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/pets" /> : <Register />} />
          <Route path="/pets" element={isLoggedIn ? <PetList /> : <Navigate to="/login" />} />
          <Route path="/pets/:id" element={isLoggedIn ? <PetDetails /> : <Navigate to="/login" />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blogs/:id" element={<BlogDetails />} />
          <Route path="/blogs/edit/:id" element={isLoggedIn ? <BlogEditForm /> : <Navigate to="/login" />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer isLoggedIn={isLoggedIn} />
    </Router>
  );
};

export default App;
