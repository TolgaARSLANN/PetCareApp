// services/photoStore.js
// Yüklenen fotoğrafı (blog kapak fotoğrafı, evcil dost fotoğrafı) saklar.
// Fotoğraf, kullanıcının toplam fotoğraf alanı yetiyorsa saklanır; sayma ve kaydetme aynı kullanıcı
// için sırayla yapılır, böylece aynı anda gelen yüklemeler birbirinin kaydını görmeden alanı aşamaz.
const express = require('express');
const mongoose = require('mongoose');
const Image = require('../models/Image');
const config = require('../config');
const { imageUrl, usedPhotoBytes, ImageError } = require('./images');
const { withUserLock } = require('./userLock');

// Fotoğraf taşıyabilen gövde (base64, en fazla 2 MB): yalnızca oturum doğrulandıktan sonra okunur
// (rotalarda authMiddleware'den sonra). Uygulamanın genel 100 KB'lık ayrıştırıcısı bu istekleri atlar
// (app.js, isPhotoWrite).
const photoJson = express.json({ limit: '3mb' });

// parsed: parseImageDataUrl sonucu. replacingId: değiştirilen fotoğraf (silineceği için alana sayılmaz).
// { id, url } döndürür; alan yetmezse ImageError (413) fırlatır.
async function storePhoto(parsed, ownerId, replacingId) {
  const { contentType, data } = parsed;
  // aggregate kimliği kendiliğinden dönüştürmez: metin kimlikle hiçbir fotoğraf eşleşmez, sınır işlemezdi
  const owner = new mongoose.Types.ObjectId(String(ownerId));
  const image = await withUserLock(owner, async () => {
    const used = await usedPhotoBytes(Image, owner, replacingId);
    if (used + data.length > config.photoStorageMb * 1024 * 1024) {
      throw new ImageError('Photo storage limit reached', 413);
    }
    return Image.create({ data, contentType, size: data.length, ownerId });
  });
  return { id: image._id, url: imageUrl(image._id) };
}

// Sessizce siler (temizlik adımı başarısız olsa da asıl işlem yanıtını bozmasın)
const deletePhoto = (id) => (id ? Image.deleteOne({ _id: id }).catch(() => {}) : Promise.resolve());

module.exports = { photoJson, storePhoto, deletePhoto };
