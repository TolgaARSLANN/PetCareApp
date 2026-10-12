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
  return { contentType: actualType, data };
}

const imageUrl = (id) => `/api/images/${id}`;

module.exports = { parseImageDataUrl, imageUrl, ImageError, MAX_IMAGE_BYTES };
