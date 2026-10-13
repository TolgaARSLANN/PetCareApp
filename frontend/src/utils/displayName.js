// Görünen ad: blog yazılarında yazar olarak görünen isim. Kurallar sunucudadır
// (backend/server/services/displayName.js); burada yalnızca sınır ve mesajlar var.
export const DISPLAY_NAME_MAX = 40;

export const DISPLAY_NAME_HINT =
  "Blog yazılarınızda yazar olarak görünür. 2–40 karakter; harf, rakam, boşluk ve . ' - _ kullanılabilir.";

// Sunucu mesajlarının Türkçesi
export const DISPLAY_NAME_ERRORS = {
  "A valid display name is required":
    "Görünen ad 2–40 karakter olmalı ve en az bir harf içermeli; yalnızca harf, rakam, boşluk ve . ' - _ kullanılabilir.",
  "Display name in use": "Bu görünen ad başka bir üye tarafından kullanılıyor. Lütfen başka bir ad seçin.",
};
