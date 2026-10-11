const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Blog = require('../models/Blog');
const config = require('../config');
const authMiddleware = require('../middleware/authMiddleware');
const { getUserId } = authMiddleware;
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

// Signs a token and puts it in an httpOnly cookie that expires together with the token.
// The token is never returned in the body, so page scripts never see it.
function startSession(res, userId) {
  const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  const { exp } = jwt.decode(token);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, expires: new Date(exp * 1000) });
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

    startSession(res, user._id);
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

// Hesap bilgisi: e-posta ve hesaba bağlı kayıt sayıları (hesap silme uyarısında gösterilir)
router.get('/account', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email');
    if (!user) return res.status(404).json({ message: 'Account not found' });
    const [petCount, blogCount] = await Promise.all([
      Pet.countDocuments({ ownerId: req.userId }),
      Blog.countDocuments({ authorId: req.userId }),
    ]);
    res.json({ email: user.email, petCount, blogCount });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Parola değiştirme: mevcut parola doğrulanır. Başarısız denemeler giriş sınırına sayılır
// (çalınmış bir oturumla parola tahmin edilemesin). Bu oturum yeni bir token ile sürer.
router.put('/password', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'New password must be different' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    startSession(res, user._id);
    res.json({ message: 'Password changed' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Hesap silme: parola onayıyla kullanıcı, tüm evcil dostları (ve kayıtları) ve blog yazıları
// kalıcı olarak silinir; oturum çerezi temizlenir.
router.delete('/account', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { password } = req.body || {};
    if (typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    const [pets, blogs] = await Promise.all([
      Pet.deleteMany({ ownerId: user._id }),
      Blog.deleteMany({ authorId: user._id }),
    ]);
    await User.deleteOne({ _id: user._id });

    res.clearCookie(AUTH_COOKIE, cookieOptions);
    res.json({ deletedPets: pets.deletedCount, deletedBlogs: blogs.deletedCount });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
