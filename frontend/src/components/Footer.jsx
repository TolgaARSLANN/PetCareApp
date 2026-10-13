import React from "react";
import { Link } from "react-router-dom";
import Logo from "./ui/Logo";
import { useAuth } from "../context/useAuth";

const Footer = () => {
  const { isLoggedIn } = useAuth();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Logo light />
          <p>Evcil dostlarınızın sağlığını tek bir yerden, kolayca takip edin.</p>
        </div>
        <nav aria-label="Alt menü">
          <ul className="footer-links">
            <li>
              <Link to="/blogs">Blog</Link>
            </li>
            <li>
              <Link to="/about-us">Hakkımızda</Link>
            </li>
            <li>
              {isLoggedIn ? <Link to="/pets">Evcil Dostlarım</Link> : <Link to="/register">Üye ol</Link>}
            </li>
          </ul>
        </nav>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Pawfect Care</p>
        <ul className="footer-legal">
          <li>
            <Link to="/privacy">Gizlilik ve Aydınlatma Metni</Link>
          </li>
          <li>
            <Link to="/terms">Kullanım Koşulları</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
