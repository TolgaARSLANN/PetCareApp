// server/index.js

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Orijinler arası istek (CORS) ve JSON parse ayarları
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect('mongodb://127.0.0.1:27017/pet_care_db')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basit test endpoint
app.get('/', (req, res) => {
  res.send('Pet Care API running...');
});

// ...
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Örnek korumalı rota kullanımı:
const authMiddleware = require('./middleware/authMiddleware');
app.get('/api/secure-data', authMiddleware, (req, res) => {
  res.json({ secret: 'Bu veriyi yalnızca giriş yapmış kullanıcılar görür' });
});
//...

// Pet rotalarını dahil ediyoruz
const petRoutes = require('./routes/pets');
app.use('/api/pets', petRoutes);

// Sunucuyu dinlet
const port = 5000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

const blogRoutes = require('./routes/blogs');
app.use('/api/blogs', blogRoutes);

