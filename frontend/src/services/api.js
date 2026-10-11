import axios from "axios";

// Oturum, sunucunun koyduğu httpOnly çerezle taşınır; sayfa kodu token'ı hiç görmez.
// Çerezin güvenle gönderilmesi için API, uygulamayla aynı adresten (/api) sunulur:
// geliştirmede Vite proxy'si (vite.config.js), yayında barındırma servisinin yönlendirmesi.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Oturum süresi dolduğunda (401) uygulamaya haber ver; AuthContext kullanıcıyı çıkış yapmış sayar
// ve korunan sayfalar giriş ekranına yönlendirir. Oturum kontrolü ve girişin kendi 401'leri hariç.
const SESSION_ENDPOINTS = ["/auth/me", "/auth/login"];

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !SESSION_ENDPOINTS.includes(error.config?.url)) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export default API;
