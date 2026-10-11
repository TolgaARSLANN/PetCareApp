import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

// Formda kaydedilmemiş değişiklik varken sayfadan ayrılmayı durdurur:
// - uygulama içi geçişlerde (bağlantı, geri tuşu) bir onay penceresi için blocker döner
// - sekmeyi kapatma / yenilemede tarayıcının kendi uyarısını açar
// Kaydetme sırasında yapılan yönlendirme engellenmesin diye allowLeave() çağrılır.
export default function useUnsavedChanges(dirty) {
  const leaving = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = ""; // eski tarayıcılar için
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const allowLeave = (allowed = true) => {
    leaving.current = allowed;
  };

  return { blocker, allowLeave };
}
