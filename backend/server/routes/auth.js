const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Blog = require('../models/Blog');
const authMiddleware = require('../middleware/authMiddleware');
const { getUserId } = authMiddleware;
const { authLimiter } = require('../middleware/rateLimits');
const { AUTH_COOKIE, cookieOptions, issueSession } = require('../middleware/authCookie');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
// bcrypt only uses the first 72 bytes of a password; anything after would be silently ignored.
// Bytes, not characters: Turkish letters such as ğ or ş take 2 bytes.
const MAX_PASSWORD_BYTES = 72;
const TOO_LONG_MESSAGE = `Password must be at most ${MAX_PASSWORD_BYTES} bytes`;
const isTooLong = (password) => Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES;

// Compared against when the email is unknown, so a failed login takes the same time whether or not
// the account exists (otherwise the response time reveals which emails are registered)
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

// E-postalar küçük harfle saklanır ve aranır: "Ali@Mail.com" ile "ali@mail.com" aynı hesaptır
const normalizeEmail = (email) => email.trim().toLowerCase();
const findByEmail = (email) => User.findOne({ email: normalizeEmail(email) });

// Returns an error message, or null if the credentials look valid
function validateCredentials(email, password) {
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return 'A valid email is required';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (isTooLong(password)) return TOO_LONG_MESSAGE;
  return null;
}

// Starts a new session (fresh login time) for the user
const startSession = (res, user) => issueSession(res, { userId: user._id, tokenVersion: user.tokenVersion || 0 });

// Kullanıcı Kaydı
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const validationError = validateCredentials(email, password);
    if (validationError) return res.status(400).json({ message: validationError });

    const existingUser = await findByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'Email in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normalizeEmail(email), password: hashedPassword });

    // Kayıt olan kişi doğrudan oturum açmış olur (aynı bilgileri bir de giriş formuna yazmasın)
    startSession(res, user);
    res.status(201).json({ userId: String(user._id) });
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

    const user = await findByEmail(email);
    // Unknown email: still run a comparison so the response time does not give it away
    const match = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !match) return res.status(400).json({ message: 'Invalid credentials' });

    startSession(res, user);
    res.json({ userId: String(user._id) });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Oturum kontrolü: giriş yapan kullanıcının ID'si, oturum yoksa null.
// Ziyaretçi için de 200 döner; "kimse" geçerli bir cevaptır (her sayfa açılışında 401 hatası üretmez).
router.get('/me', async (req, res) => {
  try {
    const userId = await getUserId(req, res);
    res.json({ userId: userId ? String(userId) : null });
  } catch (error) {
    console.error('Error checking session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Çıkış: oturum çerezini siler
router.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(204).end();
});

// Tüm cihazlardan çıkış: oturum sürümü artırılır, böylece bu hesaba verilmiş tüm token'lar
// (bu cihazınki dahil) geçersiz olur.
router.post('/logout-all', authMiddleware, async (req, res) => {
  try {
    await User.updateOne({ _id: req.userId }, { $inc: { tokenVersion: 1 } });
    res.clearCookie(AUTH_COOKIE, cookieOptions);
    res.status(204).end();
  } catch (error) {
    console.error('Error signing out everywhere:', error);
    res.status(500).json({ message: 'Server error' });
  }
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
// (çalınmış bir oturumla parola tahmin edilemesin). Oturum sürümü artırıldığı için diğer
// cihazlardaki oturumlar kapanır; bu oturum yeni sürümle verilen token ile sürer.
router.put('/password', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }
    if (isTooLong(newPassword)) return res.status(400).json({ message: TOO_LONG_MESSAGE });
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'New password must be different' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    startSession(res, user);
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
