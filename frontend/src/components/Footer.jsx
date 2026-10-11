import React from "react";
import { Link } from "react-router-dom";
import Logo from "./ui/Logo";

const Footer = ({ isLoggedIn }) => (
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
    </div>
  </footer>
);

export default Footer;
