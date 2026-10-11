import { useEffect } from "react";

const APP_NAME = "Pawfect Care";

// Her sayfanın tarayıcı sekmesinde kendi başlığını göstermesi için
const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} · Evcil dostlarınızın sağlık asistanı`;
  }, [title]);
};

export default useDocumentTitle;
