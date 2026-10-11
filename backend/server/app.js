// server/app.js
// Express uygulaması. Sunucuyu başlatmaz; böylece testlerde doğrudan kullanılabilir.

const express = require('express');
const cors = require('cors');
const config = require('./config');

const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const blogRoutes = require('./routes/blogs');

const app = express();

// CORS: only the configured frontend origin may call the API
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Pet Care API running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/blogs', blogRoutes);

// Fallback error handler for anything a route did not catch
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
