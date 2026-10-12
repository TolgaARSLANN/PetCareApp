// routes/blogs.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Blog = require('../models/Blog');
const Image = require('../models/Image');
const { parseImageDataUrl, imageUrl } = require('../services/images');
const authMiddleware = require('../middleware/authMiddleware');

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

const VALIDATION_MESSAGE = 'Title, content and author are required (within length limits)';

// Hata yanıtları: fotoğraf hataları kendi mesajıyla, doğrulama hataları 400, gerisi 500
const sendBlogError = (res, err, logMessage) => {
  if (err.name === 'ImageError') return res.status(err.status).json({ error: err.message });
  if (err.name === 'ValidationError') return res.status(400).json({ error: VALIDATION_MESSAGE });
  console.error(logMessage, err);
  return res.status(500).json({ error: 'Server error' });
};

// İstemci kapak görseli olarak yalnızca https adresi verebilir; /api/images/... adresini sunucu atar
// (başkasının fotoğrafını kendi yazısına bağlayıp silinmesine yol açamasın diye)
const isUploadedImagePath = (value) => typeof value === 'string' && value.startsWith('/api/images/');

// Fotoğrafı saklar ve yazıya bağlar. Fotoğraf yalnızca yazı geçerliyse saklanır.
const attachImage = async (blog, imageData, ownerId) => {
  const { contentType, data } = parseImageDataUrl(imageData);
  await blog.validate();
  const image = await Image.create({ data, contentType, size: data.length, ownerId });
  blog.image = imageUrl(image._id);
  blog.imageId = image._id;
  return image;
};

// Yeni bir blog yazısı ekleme (giriş gerekli). imageData: tarayıcıda küçültülmüş fotoğraf (data URL)
router.post('/', authMiddleware, async (req, res) => {
  let savedImage = null;
  try {
    const { title, content, author, image, imageData } = req.body;
    if (isUploadedImagePath(image)) return res.status(400).json({ error: 'Invalid image' });

    const blog = new Blog({ title, content, author, image, authorId: req.userId });
    if (imageData) savedImage = await attachImage(blog, imageData, req.userId);
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    // Yazı kaydedilemediyse fotoğraf sahipsiz kalmasın
    if (savedImage) await Image.deleteOne({ _id: savedImage._id }).catch(() => {});
    sendBlogError(res, err, 'Error creating blog:');
  }
});

// Blog yazısını güncelleme (yalnızca yazarı).
// image aynı gelirse fotoğraf korunur, boş gelirse kaldırılır; imageData gelirse fotoğraf değişir.
router.put('/:id', authMiddleware, async (req, res) => {
  let savedImage = null;
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ error: 'Blog not found' });
    const blog = await Blog.findOne({ _id: req.params.id, authorId: req.userId }); // Sahiplik kontrolü
    if (!blog) return res.status(404).json({ error: 'Blog not found or unauthorized' });

    const { title, content, author, image, imageData } = req.body;
    if (isUploadedImagePath(image) && image !== blog.image) {
      return res.status(400).json({ error: 'Invalid image' });
    }

    const previousImageId = blog.imageId;
    blog.set({ title, content, author });
    if (imageData) {
      savedImage = await attachImage(blog, imageData, req.userId);
    } else if (image !== undefined && image !== blog.image) {
      blog.image = image || undefined; // başka bir https adresi ya da kaldırma ("" gelirse)
      blog.imageId = undefined;
    }
    await blog.save();

    // Artık kullanılmayan eski fotoğrafı sil
    if (previousImageId && String(previousImageId) !== String(blog.imageId)) {
      await Image.deleteOne({ _id: previousImageId });
    }
    res.json(blog);
  } catch (err) {
    if (savedImage) await Image.deleteOne({ _id: savedImage._id }).catch(() => {});
    sendBlogError(res, err, 'Error updating blog:');
  }
});

// Blog yazısını silme (yalnızca yazarı); yüklenen fotoğrafı da silinir
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ error: 'Blog not found' });
    const deletedBlog = await Blog.findOneAndDelete({ _id: req.params.id, authorId: req.userId });
    if (!deletedBlog) return res.status(404).json({ error: 'Blog not found or unauthorized' });
    if (deletedBlog.imageId) await Image.deleteOne({ _id: deletedBlog.imageId });
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
