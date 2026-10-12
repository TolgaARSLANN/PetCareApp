// Testler veritabanına bağlanmaz. Her testten önce kurulan varsayılanlar (testlerin afterEach'teki
// jest.restoreAllMocks() çağrısından sonra yeniden kurulur; testler bunları kendileri değiştirebilir):
// - oturum kontrolü (User.exists): "oturum geçerli"
// - kullanıcının fotoğraf alanı (Image.aggregate): henüz hiç fotoğrafı yok
const User = require('../models/User');
const Image = require('../models/Image');

beforeEach(() => {
  jest.spyOn(User, 'exists').mockResolvedValue({ _id: 'session-ok' });
  jest.spyOn(Image, 'aggregate').mockResolvedValue([]);
});
