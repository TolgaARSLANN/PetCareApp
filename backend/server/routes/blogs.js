// routes/blogs.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Blog = require('../models/Blog');
const { parseImageDataUrl } = require('../services/images');
const { photoJson, storePhoto, deletePhoto } = require('../services/photoStore');
const authMiddleware = require('../middleware/authMiddleware');
const { photoUploadLimiter } = require('../middleware/rateLimits');
const users = require('../services/users');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 50;

// Sorgu parametresini pozitif tam sayıya çevirir; geçersizse varsayılanı döndürür
const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

// Blog yazılarını sayfa sayfa listeleme (herkese açık)
// ?page=1&limit=9 → { items, page, limit, total, totalPages }
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const total = await Blog.countDocuments();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    // Aralık dışındaki sayfa son sayfaya çekilir (ör. son yazı silindiğinde)
    const page = Math.min(toPositiveInt(req.query.page, 1), totalPages);
    const items = await Blog.find()
      .sort({ date: -1, _id: -1 }) // _id eşit tarihlerde sırayı sabit tutar; sayfalar arasında kayma olmaz
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ items, page, limit, total, totalPages });
  } catch (err) {
    console.error('Error listing blogs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Tek bir blog yazısını alma (herkese açık)
router.get('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ error: 'Blog not found' });
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const VALIDATION_MESSAGE = 'Title and content are required (within length limits)';
// Yazar adı istemciden alınmaz: yazarın görünen adıdır (başkası adına yazı yayınlanamasın)
const DISPLAY_NAME_REQUIRED = 'Display name required';

// Hata yanıtları: fotoğraf hataları kendi mesajıyla, doğrulama hataları 400, gerisi 500
const sendBlogError = (res, err, logMessage) => {
  if (err.name === 'ImageError') return res.status(err.status).json({ error: err.message });
  if (err.name === 'ValidationError') return res.status(400).json({ error: VALIDATION_MESSAGE });
  console.error(logMessage, err);
  return res.status(500).json({ error: 'Server error' });
};

// Kapak görseli yalnızca yüklenen fotoğraf olabilir; adresini (/api/images/...) sunucu atar.
// İstemci yeni bir adres veremez: başkasının fotoğrafına bağlanamaz ve dış bir siteden görsel
// (okuyucuların IP'sini toplayan bir "takip pikseli" olabilir) koyamaz. Eski yazılardaki https
// adresleri değiştirilmedikçe kalır.
const isNewImageAddress = (value, current) => typeof value === 'string' && value !== '' && value !== current;

// Fotoğrafı saklar ve yazıya bağlar. Fotoğraf yalnızca yazı geçerliyse saklanır.
const attachImage = async (blog, imageData, ownerId, replacingId) => {
  const parsed = parseImageDataUrl(imageData);
  await blog.validate();
  const photo = await storePhoto(parsed, ownerId, replacingId);
  blog.image = photo.url;
  blog.imageId = photo.id;
  return photo;
};

// Yeni bir blog yazısı ekleme (giriş gerekli). imageData: tarayıcıda küçültülmüş fotoğraf (data URL)
router.post('/', authMiddleware, photoJson, photoUploadLimiter, async (req, res) => {
  let savedImage = null;
  try {
    const { title, content, image, imageData } = req.body;
    if (isNewImageAddress(image, undefined)) return res.status(400).json({ error: 'Invalid image' });
    const author = await users.getDisplayName(req.userId);
    if (!author) return res.status(409).json({ error: DISPLAY_NAME_REQUIRED });

    const blog = new Blog({ title, content, author, image, authorId: req.userId });
    if (imageData) savedImage = await attachImage(blog, imageData, req.userId);
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    // Yazı kaydedilemediyse fotoğraf sahipsiz kalmasın
    if (savedImage) await deletePhoto(savedImage.id);
    sendBlogError(res, err, 'Error creating blog:');
  }
});

// Blog yazısını güncelleme (yalnızca yazarı).
// image aynı gelirse fotoğraf korunur, boş gelirse kaldırılır; imageData gelirse fotoğraf değişir.
router.put('/:id', authMiddleware, photoJson, photoUploadLimiter, async (req, res) => {
  let savedImage = null;
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ error: 'Blog not found' });
    const blog = await Blog.findOne({ _id: req.params.id, authorId: req.userId }); // Sahiplik kontrolü
    if (!blog) return res.status(404).json({ error: 'Blog not found or unauthorized' });

    const { title, content, image, imageData } = req.body;
    if (isNewImageAddress(image, blog.image)) return res.status(400).json({ error: 'Invalid image' });

    const previousImageId = blog.imageId;
    // Görünen adı henüz olmayan eski hesapların yazıları eski yazar adını korur
    const author = (await users.getDisplayName(req.userId)) || blog.author;
    blog.set({ title, content, author });
    if (imageData) {
      savedImage = await attachImage(blog, imageData, req.userId, previousImageId);
    } else if (image === '' && blog.image) {
      blog.image = undefined; // fotoğrafı kaldırma
      blog.imageId = undefined;
    }
    await blog.save();

    // Artık kullanılmayan eski fotoğrafı sil
    if (previousImageId && String(previousImageId) !== String(blog.imageId)) {
      await deletePhoto(previousImageId);
    }
    res.json(blog);
  } catch (err) {
    if (savedImage) await deletePhoto(savedImage.id);
    sendBlogError(res, err, 'Error updating blog:');
  }
});

// Blog yazısını silme (yalnızca yazarı); yüklenen fotoğrafı da silinir
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ error: 'Blog not found' });
    const deletedBlog = await Blog.findOneAndDelete({ _id: req.params.id, authorId: req.userId });
    if (!deletedBlog) return res.status(404).json({ error: 'Blog not found or unauthorized' });
    await deletePhoto(deletedBlog.imageId);
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
