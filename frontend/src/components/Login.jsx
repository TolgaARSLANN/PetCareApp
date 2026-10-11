import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", response.data.token); // Token'ı localStorage'a kaydet
      setIsLoggedIn(true); // Oturum durumunu güncelle
      setError(""); // Hataları sıfırla
      navigate("/pets"); // My Pets sayfasına yönlendir
    } catch (err) {
      setError("E-posta veya parola hatalı.");
    }
  };

  return (
    <div className="container">
      <h2>Giriş</h2>
      {location.state?.registered && !error && (
        <div className="alert alert-success">Kayıt başarılı. Şimdi giriş yapabilirsiniz.</div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Parola
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Giriş Yap
        </button>
      </form>
    </div>
  );
};

export default Login;
