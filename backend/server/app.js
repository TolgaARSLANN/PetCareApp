// server/app.js
// Express uygulaması. Sunucuyu başlatmaz; böylece testlerde doğrudan kullanılabilir.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { apiLimiter, imageLimiter } = require('./middleware/rateLimits');
const database = require('./services/database');
const requireProxySecret = require('./middleware/proxySecret');

const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const blogRoutes = require('./routes/blogs');
const imageRoutes = require('./routes/images');

const app = express();

// Behind a reverse proxy, use the client IP from X-Forwarded-For for rate limiting
app.set('trust proxy', config.trustProxy);

// Security headers (no-sniff, frame denial, HSTS, a strict CSP for API responses, ...)
app.use(helmet());

// In production only requests that came through the site's proxy reach the API
app.use(requireProxySecret);

// CORS: only the configured frontend origin may call the API, with cookies
app.use(cors({ origin: config.clientOrigin, credentials: true }));
// JSON gövdeler en fazla 100 KB. Fotoğraf taşıyabilen istekler (blog yazısı, evcil dost ekleme ve
// düzenleme) burada atlanır; onların gövdesi rotada, oturum doğrulandıktan sonra 3 MB sınırla okunur
// (services/photoStore.js, photoJson).
const smallJson = express.json({ limit: '100kb' });
const isPhotoWrite = (req) =>
  (req.method === 'POST' && (req.path === '/api/blogs' || req.path === '/api/pets')) ||
  (req.method === 'PUT' && /^\/api\/(blogs|pets)\/[^/]+$/.test(req.path));
app.use((req, res, next) => (isPhotoWrite(req) ? next() : smallJson(req, res, next)));
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
  res.send('Pet Care API running...');
});

// Fotoğrafların kendi, daha cömert sınırı var: bir blog sayfası tek seferde 9 fotoğraf ister
app.use('/api/images', imageLimiter, imageRoutes);
app.use('/api', apiLimiter);

// Sağlık kontrolü: barındırma servisi (Render) bunu yoklar; veritabanı bağlantısı yoksa 503 döner ve
// servis yeniden başlatılır. clientIp, sunucunun isteği yapanı hangi IP ile gördüğünü gösterir
// (yalnızca isteği yapanın kendi IP'si): TRUST_PROXY doğruysa ziyaretçinin gerçek IP'si olmalı.
// proxyChain, isteğin geçtiği adresler sunucudan geriye doğru: [0] doğrudan bağlanan vekil, sonra
// X-Forwarded-For sağdan sola. Ziyaretçinin IP'si hangi sıradaysa TRUST_PROXY o sayı olmalı.
app.get('/api/health', (req, res) => {
  const connected = database.isConnected();
  const forwarded = (req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
    clientIp: req.ip,
    proxyChain: [req.socket.remoteAddress, ...forwarded.reverse()],
  });
});
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
