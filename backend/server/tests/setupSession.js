// Testler veritabanına bağlanmaz. Oturum kontrolü (User.exists) varsayılan olarak "oturum geçerli"
// döner; oturum sürümünü sınayan testler bunu kendileri değiştirir. Testlerin afterEach'teki
// jest.restoreAllMocks() çağrısından sonra her test için yeniden kurulur.
const User = require('../models/User');

beforeEach(() => {
  jest.spyOn(User, 'exists').mockResolvedValue({ _id: 'session-ok' });
});
