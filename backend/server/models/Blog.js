// models/Blog.js
const mongoose = require('mongoose');

// Uzunluk sınırları: frontend/src/components/BlogForm.jsx içindeki maxLength değerleriyle aynı
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  content: { type: String, required: true, trim: true, maxlength: 20000 },
  author: { type: String, required: true, trim: true, maxlength: 60 }, // Görünen yazar adı
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Yazıyı oluşturan kullanıcı
  date: { type: Date, default: Date.now },
  image: { type: String, trim: true, maxlength: 500 }, // Opsiyonel, blog görseli için
});

// Blog listesi bu sırayla sayfalanır (routes/blogs.js)
blogSchema.index({ date: -1, _id: -1 });

module.exports = mongoose.model('Blog', blogSchema);
