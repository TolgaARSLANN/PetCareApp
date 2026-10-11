// server/app.js
// Express uygulaması. Sunucuyu başlatmaz; böylece testlerde doğrudan kullanılabilir.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { apiLimiter } = require('./middleware/rateLimits');

const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const blogRoutes = require('./routes/blogs');

const app = express();

// Behind a reverse proxy, use the client IP from X-Forwarded-For for rate limiting
app.set('trust proxy', config.trustProxy);

// Security headers (no-sniff, frame denial, HSTS, a strict CSP for API responses, ...)
app.use(helmet());

// CORS: only the configured frontend origin may call the API, with cookies
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
  res.send('Pet Care API running...');
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/blogs', blogRoutes);

// Unknown API routes answer in JSON like the rest of the API (not Express's HTML page)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Fallback error handler for anything a route did not catch
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Malformed JSON or an oversized body: client error, not a server crash
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(err.status).json({ error: 'Invalid request body' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
