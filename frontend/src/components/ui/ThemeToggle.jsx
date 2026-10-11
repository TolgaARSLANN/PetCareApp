import React from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import useTheme from "../../hooks/useTheme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Açık temaya geç" : "Koyu temaya geç";

  return (
    <button type="button" className="btn-icon theme-toggle" onClick={toggleTheme} aria-label={label} title={label}>
      {isDark ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
    </button>
  );
};

export default ThemeToggle;
