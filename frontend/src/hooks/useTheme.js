import { useCallback, useEffect, useState } from "react";

// Tema seçimi: kullanıcı açıkça seçtiyse localStorage'da tutulur, seçmediyse sistem tercihi izlenir.
// İlk değer index.html'deki betik tarafından sayfa çizilmeden önce <html data-theme> olarak ayarlanır.
const STORAGE_KEY = "theme";
const THEME_COLORS = { light: "#0f766e", dark: "#0e1615" };

const readStored = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
};

const useTheme = () => {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");

  // Kullanıcı bir seçim yapmadıysa işletim sistemi teması değiştiğinde uyum sağla
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      if (readStored()) return;
      const next = e.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Depolama kapalıysa seçim yalnızca bu oturumda geçerli olur
    }
    applyTheme(next);
    setTheme(next);
  }, [theme]);

  return { theme, toggleTheme };
};

export default useTheme;
