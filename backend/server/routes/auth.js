const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { getUserId } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimits');
const { AUTH_COOKIE, cookieOptions } = require('../middleware/authCookie');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Returns an error message, or null if the credentials look valid
function validateCredentials(email, password) {
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return 'A valid email is required';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

// Kullanıcı Kaydı
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const validationError = validateCredentials(email, password);
    if (validationError) return res.status(400).json({ message: validationError });

    const normalizedEmail = email.trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: 'Email in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email: normalizedEmail, password: hashedPassword });

    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Kullanıcı Girişi
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    // The token goes into an httpOnly cookie that expires together with the token;
    // it is not returned in the body, so page scripts never see it.
    const { exp } = jwt.decode(token);
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions, expires: new Date(exp * 1000) });
    res.json({ userId: String(user._id) });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Oturum kontrolü: giriş yapan kullanıcının ID'si, oturum yoksa null.
// Ziyaretçi için de 200 döner; "kimse" geçerli bir cevaptır (her sayfa açılışında 401 hatası üretmez).
router.get('/me', (req, res) => {
  const userId = getUserId(req);
  res.json({ userId: userId ? String(userId) : null });
});

// Çıkış: oturum çerezini siler
router.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(204).end();
});

module.exports = router;
