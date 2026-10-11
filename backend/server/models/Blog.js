// models/Blog.js
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true }, // Görünen yazar adı
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Yazıyı oluşturan kullanıcı
  date: { type: Date, default: Date.now },
  image: { type: String }, // Opsiyonel, blog görseli için
});

module.exports = mongoose.model('Blog', blogSchema);
