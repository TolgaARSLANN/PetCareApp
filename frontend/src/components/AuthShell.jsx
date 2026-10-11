import React from "react";
import { PawPrint } from "@phosphor-icons/react";

// Giriş ve kayıt sayfalarının ortak kart düzeni
const AuthShell = ({ title, subtitle, children, footer }) => (
  <div className="auth-page">
    <div className="card auth-card">
      <span className="icon-tile icon-tile-lg">
        <PawPrint size={28} weight="fill" aria-hidden="true" />
      </span>
      <h1 className="auth-title">{title}</h1>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}
      {children}
      {footer && <p className="auth-footer">{footer}</p>}
    </div>
  </div>
);

export default AuthShell;
