// services/database.js
// Veritabanı bağlantısının durumu (sağlık kontrolü için). Ayrı bir modülde: testler bunu taklit edebilir.
const mongoose = require('mongoose');

const isConnected = () => mongoose.connection.readyState === 1;

module.exports = { isConnected };
