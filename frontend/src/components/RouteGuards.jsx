import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { PageLoader } from "./ui/Loading";

// Giriş gerektiren sayfalar: oturum kontrol edilirken bekler, oturum yoksa girişe yönlendirir
// ve girişten sonra kullanıcıyı geldiği sayfaya geri götürmek için adresi saklar.
export const RequireAuth = ({ children }) => {
  const { isLoggedIn, checking, endReason } = useAuth();
  const location = useLocation();
  if (checking) return <PageLoader label="Oturum kontrol ediliyor" />;
  // Hesap silindiyse giriş sayfası anlamsız: ana sayfaya bilgi mesajıyla git
  if (!isLoggedIn && endReason === "accountDeleted") {
    return <Navigate to="/" replace state={{ accountDeleted: true }} />;
  }
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

// Giriş ve kayıt sayfaları: zaten giriş yapılmışsa evcil dostlar sayfasına gider
export const GuestOnly = ({ children }) => {
  const { isLoggedIn, checking } = useAuth();
  if (checking) return <PageLoader label="Oturum kontrol ediliyor" />;
  if (isLoggedIn) return <Navigate to="/pets" replace />;
  return children;
};
