// models/Blog.js
const mongoose = require('mongoose');

const UPLOADED_IMAGE = /^\/api\/images\/[0-9a-f]{24}$/;

const isHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

// Uzunluk sınırları: frontend/src/components/BlogForm.jsx içindeki maxLength değerleriyle aynı
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  content: { type: String, required: true, trim: true, maxlength: 20000 },
  author: { type: String, required: true, trim: true, maxlength: 60 }, // Görünen yazar adı
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Yazıyı oluşturan kullanıcı
  date: { type: Date, default: Date.now },
  // Opsiyonel kapak görseli: yüklenen fotoğraf (/api/images/<id>, sunucu atar) ya da eski yazılardaki
  // https adresi. http görseller https sitede engellenir; javascript:/data: adreslerinin burada işi yoktur.
  image: {
    type: String,
    trim: true,
    maxlength: 500,
    validate: {
      validator: (v) => !v || isHttpsUrl(v) || UPLOADED_IMAGE.test(v),
      message: 'Image must be an uploaded photo or an https:// URL',
    },
  },
  // Yüklenen fotoğrafın kaydı: yazı silinince ya da fotoğraf değişince bu kayıt da silinir
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
});

// Blog listesi bu sırayla sayfalanır (routes/blogs.js)
blogSchema.index({ date: -1, _id: -1 });

module.exports = mongoose.model('Blog', blogSchema);
