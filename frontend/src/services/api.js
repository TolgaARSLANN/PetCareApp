import axios from "axios";

const API = axios.create({
  // Deploy ederken frontend/.env içinde VITE_API_URL tanımlayın
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Her istekte token göndermek için interceptor
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token"); // LocalStorage'dan token al
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Yanıtların hata işleme mekanizması
API.interceptors.response.use(
  (response) => {
    return response; // Yanıt başarılıysa direkt döndür
  },
  (error) => {
    if (error.response) {
      // Sunucudan dönen hata durumları
      console.error("Response error:", error.response.data.message || error.response.statusText);
      if (error.response.status === 401) {
        // Yetkilendirme hatası durumunda kullanıcıyı çıkışa zorla
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } else {
      // Sunucudan yanıt alınamayan durumlar
      console.error("Network error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
