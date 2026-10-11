// routes/blogs.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Blog = require('../models/Blog');
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Yeni bir blog yazısı ekleme (giriş gerekli)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, author, image } = req.body;
    const newBlog = new Blog({ title, content, author, image, authorId: req.userId });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Title, content and author are required (within length limits)' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Blog yazısını güncelleme (yalnızca yazarı)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ error: 'Blog not found' });
    const { title, content, author, image } = req.body;
    const updatedBlog = await Blog.findOneAndUpdate(
      { _id: req.params.id, authorId: req.userId }, // Sahiplik kontrolü
      { title, content, author, image },
      { new: true, runValidators: true }
    );
    if (!updatedBlog) return res.status(404).json({ error: 'Blog not found or unauthorized' });
    res.json(updatedBlog);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Title, content and author are required (within length limits)' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Blog yazısını silme (yalnızca yazarı)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ error: 'Blog not found' });
    const deletedBlog = await Blog.findOneAndDelete({ _id: req.params.id, authorId: req.userId });
    if (!deletedBlog) return res.status(404).json({ error: 'Blog not found or unauthorized' });
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
