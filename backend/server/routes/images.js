// routes/images.js
// Blog kapak fotoğraflarını sunar (herkese açık, blog yazıları gibi).
const express = require('express');
const mongoose = require('mongoose');
const Image = require('../models/Image');

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Image not found' });
    const image = await Image.findById(req.params.id).select('data contentType');
    if (!image) return res.status(404).json({ error: 'Image not found' });
    res.set({
      'Content-Type': image.contentType,
      // İçerik hiç değişmez (yeni fotoğraf yeni kimlik alır), bu yüzden tarayıcı bir hafta önbellekte tutabilir.
      // "private": ara sunucular (CDN) saklamaz; silinen fotoğraf onlardan yeni ziyaretçilere sunulmaya devam etmez.
      'Cache-Control': 'private, max-age=604800, immutable',
    });
    res.send(image.data);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
