import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import AuthShell from "./AuthShell";
import Alert from "./ui/Alert";
import Field from "./ui/Field";
import PasswordInput from "./ui/PasswordInput";
import { Spinner } from "./ui/Loading";
import useDocumentTitle from "../hooks/useDocumentTitle";

const Login = ({ setIsLoggedIn }) => {
  useDocumentTitle("Giriş yap");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", response.data.token); // Token'ı localStorage'a kaydet
      setIsLoggedIn(true);
      navigate("/pets");
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 400
          ? "E-posta veya parola hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin."
          : status
            ? "Giriş şu anda yapılamıyor. Lütfen biraz sonra tekrar deneyin."
            : "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin."
      );
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Tekrar hoş geldiniz"
      subtitle="Evcil dostlarınızın kayıtlarına ulaşmak için giriş yapın."
      footer={
        <>
          Hesabınız yok mu? <Link to="/register">Ücretsiz üye olun</Link>
        </>
      }
    >
      {location.state?.registered && !error && (
        <Alert type="success">Kaydınız tamamlandı. Şimdi giriş yapabilirsiniz.</Alert>
      )}
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSubmit} className="form-stack">
        <Field id="email" label="E-posta" required>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
        </Field>
        <Field id="password" label="Parola" required>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy && <Spinner size={18} />}
          {busy ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
