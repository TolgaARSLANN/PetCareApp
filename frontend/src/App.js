import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import PetList from "./components/PetList";
import PetDetails from "./components/PetDetails";
import BlogList from "./components/BlogList"; // Blog listesi için component
import BlogDetails from "./components/BlogDetails"; // Blog detayları için component
import BlogEditForm from "./components/BlogEditForm"; // Blog düzenleme formu için component
import AboutUs from "./components/AboutUs"; // About Us (Hakkımızda) componenti
import Login from "./components/Login";
import Register from "./components/Register";
import "./styles/Homepage.css";

const App = () => {
  // Oturum durumu ilk render'da okunur; böylece sayfa yenilenince login'e kısa yönlendirme olmaz
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <Routes>
        <Route
          path="/"
          element={
            <div className="homepage">
              <div className="banner">
                <h1 className="banner-title">Pawfect Care'a Hoşgeldiniz 🐾</h1>
                <p className="banner-subtitle">Evcil hayvanlarınızın yönetimi için nihai çözümünüz!</p>
              </div>
              <div className="about-section">
                <h2>Neden Bizi Seçmelisiniz?</h2>
                <p>
                  Pawfect Care'de evcil hayvanlarınızın mutlu ve sağlıklı olmasını sağlıyoruz.
                  Evcil dostlarımızın ihmal edilmelerinin önüne geçiyoruz.
                  Sosyal yaşantınızla ilişkilendirme fırsatı sunuyoruz.
                </p>
              </div>
            </div>
          }
        />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/pets" /> : <Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/register" element={isLoggedIn ? <Navigate to="/pets" /> : <Register />} />
        <Route path="/pets" element={isLoggedIn ? <PetList /> : <Navigate to="/login" />} />
        <Route path="/pets/:id" element={isLoggedIn ? <PetDetails /> : <Navigate to="/login" />} />
        <Route path="/blogs" element={<BlogList />} /> {/* Blog listesi rotası */}
        <Route path="/blogs/:id" element={<BlogDetails />} /> {/* Blog detayları rotası */}
        <Route path="/blogs/edit/:id" element={isLoggedIn ? <BlogEditForm /> : <Navigate to="/login" />} /> {/* Blog düzenleme rotası */}
        <Route path="/about-us" element={<AboutUs />} /> {/* About Us rotası */}
      </Routes>
    </Router>
  );
};

export default App;
