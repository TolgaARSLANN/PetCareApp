// Kapak fotoğrafını göndermeden önce tarayıcıda hazırlar:
// - en fazla 1600 px'e küçültür (telefon fotoğrafları 5-10 MB olabilir; sonuç genelde 150-300 KB)
// - telefonun yatay/dikey bilgisine göre döndürür
// - yeniden kodlar: fotoğraftaki konum (GPS) gibi EXIF bilgileri silinir, yazıyla herkese açılmaz
// Sunucu ayrıca türü ve boyutu doğrular (backend/server/services/images.js).

export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
export const MAX_DIMENSION = 1600;
const MAX_RESULT_BYTES = 1.9 * 1024 * 1024; // sunucu sınırı 2 MB

export class ImageProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// Sonuç: { dataUrl, width, height, size, type }
export async function prepareImage(file, { maxDimension = MAX_DIMENSION } = {}) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new ImageProcessingError("Lütfen bir fotoğraf dosyası seçin (JPEG, PNG ya da WebP).");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageProcessingError("Fotoğraf çok büyük. En fazla 20 MB olabilir.");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageProcessingError("Bu fotoğraf açılamadı. Lütfen JPEG, PNG ya da WebP biçiminde bir fotoğraf seçin.");
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  // Saydam PNG'ler JPEG'e çevrilirse siyah görünmesin
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  // WebP en küçük dosyayı verir; desteklemeyen tarayıcılar başka tür döndürür, o zaman JPEG
  let blob = await toBlob(canvas, "image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.85);
  if (blob && blob.size > MAX_RESULT_BYTES) blob = await toBlob(canvas, blob.type, 0.6);
  if (!blob || blob.size > MAX_RESULT_BYTES) {
    throw new ImageProcessingError("Fotoğraf hazırlanamadı. Lütfen başka bir fotoğraf deneyin.");
  }

  return { dataUrl: await blobToDataUrl(blob), width, height, size: blob.size, type: blob.type };
}
