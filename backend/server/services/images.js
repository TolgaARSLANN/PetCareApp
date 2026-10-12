// services/images.js
// Yüklenen fotoğrafı ("data:image/webp;base64,..." biçiminde) çözer ve doğrular.
// Türe dosya içeriğinden (imza baytları) karar verilir: bildirilen türe ya da uzantıya güvenilmez.

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // tarayıcı fotoğrafı ~300 KB'a küçültür; 2 MB bol bir üst sınır

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SIGNATURES = {
  'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length > 8 && b.subarray(0, 8).equals(PNG_SIGNATURE),
  'image/webp': (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
};

// En büyük kenar. Bizim form en fazla 1600 px gönderir. Asıl amaç "fotoğraf bombası"nı durdurmak:
// küçük bir dosya (ör. 380 KB'lık tek renk PNG) açılınca yüzlerce MB bellek isteyip o yazıyı görüntüleyen
// herkesin tarayıcısını kilitleyebilir. Ölçüler dosya açılmadan başlıktan okunur.
const MAX_DIMENSION = 4096;

// Piksel ölçülerini dosya başlığından okur; okunamazsa null
const DIMENSION_READERS = {
  'image/png': (b) => (b.length >= 24 ? { width: b.readUInt32BE(16), height: b.readUInt32BE(20) } : null),

  // JPEG: işaretçiler (FF xx) arasında çerçeve başlığını (SOF) arar
  'image/jpeg': (b) => {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      if (marker === 0xff) {
        i += 1; // dolgu baytı
        continue;
      }
      // Uzunluğu olmayan işaretçiler
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
        i += 2;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) return null; // görüntü verisi SOF'tan önce başladı
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
  },

  // WebP: kayıplı (VP8), kayıpsız (VP8L) ya da genişletilmiş (VP8X, ör. saydamlık) biçim
  'image/webp': (b) => {
    if (b.length < 30) return null;
    const format = b.toString('ascii', 12, 16);
    if (format === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
      return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    }
    if (format === 'VP8L' && b[20] === 0x2f) {
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (format === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
    return null;
  },
};

class ImageError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ImageError';
    this.status = status;
  }
}

// { contentType, data } döndürür; geçersizse ImageError fırlatır
function parseImageDataUrl(value) {
  if (typeof value !== 'string') throw new ImageError('Image must be a data URL');
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(value);
  if (!match) throw new ImageError('Only JPEG, PNG and WebP images are accepted');
  const [, declaredType, base64] = match;
  // Çözmeden önce kaba boyut kontrolü (base64, veriyi 4/3 büyütür)
  if (base64.length * 0.75 > MAX_IMAGE_BYTES + 3) throw new ImageError('Image is too large', 413);

  const data = Buffer.from(base64, 'base64');
  if (data.length > MAX_IMAGE_BYTES) throw new ImageError('Image is too large', 413);
  const actualType = Object.keys(SIGNATURES).find((type) => SIGNATURES[type](data));
  if (!actualType) throw new ImageError('Only JPEG, PNG and WebP images are accepted');
  if (actualType !== declaredType) throw new ImageError('Image content does not match its type');

  const size = DIMENSION_READERS[actualType](data);
  if (!size || !size.width || !size.height) throw new ImageError('Image could not be read');
  if (size.width > MAX_DIMENSION || size.height > MAX_DIMENSION) {
    throw new ImageError('Image dimensions are too large');
  }
  return { contentType: actualType, data, ...size };
}

const imageUrl = (id) => `/api/images/${id}`;

// Total bytes of a user's stored photos, optionally leaving out one (the photo being replaced)
async function usedPhotoBytes(Image, ownerId, exceptId) {
  const match = { ownerId };
  if (exceptId) match._id = { $ne: exceptId };
  const [row] = await Image.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$size' } } }]);
  return row?.total || 0;
}

module.exports = { parseImageDataUrl, imageUrl, usedPhotoBytes, ImageError, MAX_IMAGE_BYTES, MAX_DIMENSION };
