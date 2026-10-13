import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { AuthContext } from "./useAuth";

// Oturum durumu: sayfa açılınca sunucuya sorulur (/auth/me). Token httpOnly çerezde
// olduğu için tarayıcı kodu onu okuyamaz; kim olduğumuzu yalnızca sunucu söyler.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, displayName } | null (displayName eski hesaplarda null)
  const [checking, setChecking] = useState(true);
  // Oturum neden kapandı; korumalı sayfalar yönlendirirken bunu kullanır (bkz. RouteGuards):
  // "accountDeleted" → ana sayfa, "sessionEnded" / "signedOutEverywhere" → açıklamalı giriş sayfası
  const [endReason, setEndReason] = useState(null);

  useEffect(() => {
    // Eski sürümden kalan, JavaScript'in okuyabildiği token'ı temizle
    try {
      localStorage.removeItem("token");
    } catch {
      // Depolama kapalı olabilir; önemli değil
    }

    let cancelled = false;
    API.get("/auth/me")
      .then(
        ({ data }) =>
          !cancelled && setUser(data.userId ? { id: data.userId, displayName: data.displayName || null } : null)
      )
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setChecking(false));

    // Sunucu oturumu reddetti: süresi doldu ya da başka bir cihazdan kapatıldı (parola değişimi vb.)
    const onExpired = () => {
      setEndReason("sessionEnded");
      setUser(null);
    };
    window.addEventListener("auth:expired", onExpired);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:expired", onExpired);
    };
  }, []);

  const login = useCallback((userId, displayName = null) => {
    setEndReason(null);
    setUser({ id: userId, displayName });
  }, []);

  // Hesabım sayfasında görünen ad değişince (blog formu yazar adını buradan gösterir)
  const setDisplayName = useCallback((displayName) => {
    setUser((current) => (current ? { ...current, displayName } : current));
  }, []);

  const logout = useCallback(async () => {
    try {
      await API.post("/auth/logout");
    } finally {
      setEndReason(null);
      setUser(null);
    }
  }, []);

  // Sunucu oturumu zaten kapattığında (ör. hesap silindi) yalnızca yerel durumu temizler.
  // Nedeni saklanır; yönlendirmeyi RequireAuth buna göre yapar (zamanlamaya bağlı kalmadan).
  const endSession = useCallback((reason = null) => {
    setEndReason(reason);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoggedIn: Boolean(user), checking, endReason, login, logout, endSession, setDisplayName }),
    [user, checking, endReason, login, logout, endSession, setDisplayName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
