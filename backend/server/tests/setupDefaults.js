// Testler veritabanına bağlanmaz. Her testten önce kurulan varsayılanlar (testlerin afterEach'teki
// jest.restoreAllMocks() çağrısından sonra yeniden kurulur; testler bunları kendileri değiştirebilir):
// - oturum kontrolü (User.exists): "oturum geçerli"
// - kullanıcının fotoğraf alanı (Image.aggregate): henüz hiç fotoğrafı yok
// - görünen ad: kullanıcının adı "Test Yazar", istenen her ad boşta
const User = require('../models/User');
const Image = require('../models/Image');
const users = require('../services/users');

beforeEach(() => {
  jest
    .spyOn(User, 'exists')
    .mockImplementation(async (filter) => (filter?.displayNameKey ? null : { _id: 'session-ok' }));
  jest.spyOn(Image, 'aggregate').mockResolvedValue([]);
  jest.spyOn(users, 'getDisplayName').mockResolvedValue('Test Yazar');
});
