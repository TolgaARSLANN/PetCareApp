// Sunucunun fotoğraf hatalarının Türkçesi (backend/server/services/images.js, middleware/rateLimits.js).
// Blog kapak fotoğrafı ve evcil dost fotoğrafı aynı kuralları paylaşır.
const PHOTO_ERRORS = {
  "Image is too large": "Fotoğraf çok büyük. Lütfen başka bir fotoğraf deneyin.",
  "Only JPEG, PNG and WebP images are accepted": "Yalnızca JPEG, PNG ve WebP fotoğraflar kabul edilir.",
  "Image content does not match its type": "Bu dosya bir fotoğraf gibi görünmüyor.",
  "Image could not be read": "Bu fotoğraf okunamadı. Lütfen başka bir fotoğraf deneyin.",
  "Image dimensions are too large": "Fotoğrafın ölçüleri çok büyük (en fazla 4096 piksel).",
  "Too many photo uploads, please try again later":
    "Son bir saatte çok fazla fotoğraf yüklediniz. Lütfen biraz sonra tekrar deneyin ya da fotoğrafsız kaydedin.",
  "Photo storage limit reached":
    "Fotoğraf alanınız doldu (en fazla 25 MB). Eski yazılarınızdaki ya da evcil dostlarınızdaki fotoğrafları kaldırarak yer açabilirsiniz.",
};

// Sunucu hatası bir fotoğraf hatasıysa Türkçe açıklaması, değilse null
export const photoErrorMessage = (err) => PHOTO_ERRORS[err?.response?.data?.error] || null;
