// routes/blogs.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Blog = require('../models/Blog');
const authMiddleware = require('../middleware/authMiddleware');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Tüm blog yazılarını listeleme (herkese açık)
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 });
    res.json(blogs);
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
      return res.status(400).json({ error: 'Title, content and author are required' });
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
      return res.status(400).json({ error: 'Title, content and author are required' });
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
