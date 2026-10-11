import { createContext, useContext } from "react";

// Oturum bağlamı ve onu okuyan hook. AuthProvider (AuthContext.jsx) değeri sağlar.
// Ayrı dosyada durur ki AuthContext.jsx yalnızca bileşen dışa aktarsın (Vite Fast Refresh için).
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
};
