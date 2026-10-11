import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { List, SignOut, UserCircle, X } from "@phosphor-icons/react";
import Logo from "./ui/Logo";
import ThemeToggle from "./ui/ThemeToggle";
import { useAuth } from "../context/useAuth";

const navClass = ({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`;

const Navbar = () => {
  const { isLoggedIn, checking, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Mobil menü, açıldığı sayfaya bağlıdır: başka sayfaya geçilince kendiliğinden kapalı sayılır
  // (sayfa değişiminde efektle kapatmak bir render boyunca açık bırakırdı)
  const [openOnPath, setOpenOnPath] = useState(null);
  const open = openOnPath === location.pathname;
  const setOpen = (value) => setOpenOnPath(value ? location.pathname : null);

  // Escape ile mobil menüyü kapat
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpenOnPath(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="site-header">
      <nav className="container navbar" aria-label="Ana menü">
        <Link to="/" className="navbar-brand" aria-label="Pawfect Care ana sayfa">
          <Logo />
        </Link>

        <div id="main-menu" className={`navbar-menu ${open ? "is-open" : ""}`}>
          <ul className="nav-links">
            {isLoggedIn && (
              <li>
                <NavLink to="/pets" className={navClass}>
                  Evcil Dostlarım
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to="/blogs" className={navClass}>
                Blog
              </NavLink>
            </li>
            <li>
              <NavLink to="/about-us" className={navClass}>
                Hakkımızda
              </NavLink>
            </li>
          </ul>

          <div className="nav-actions">
            {/* Oturum kontrol edilirken düğmeler bir an yanlış görünmesin */}
            {checking ? null : isLoggedIn ? (
              <>
                <NavLink
                  to="/account"
                  className={({ isActive }) => `btn btn-ghost btn-sm ${isActive ? "is-current" : ""}`}
                >
                  <UserCircle size={18} aria-hidden="true" />
                  Hesabım
                </NavLink>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  <SignOut size={18} aria-hidden="true" />
                  Çıkış yap
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Giriş yap
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Ücretsiz üye ol
                </Link>
              </>
            )}
          </div>
        </div>

        <ThemeToggle />

        <button
          type="button"
          className="btn-icon navbar-toggle"
          aria-expanded={open}
          aria-controls="main-menu"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} aria-hidden="true" /> : <List size={24} aria-hidden="true" />}
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
