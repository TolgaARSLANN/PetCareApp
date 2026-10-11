// server/index.js
// Veritabanına bağlanır ve sunucuyu başlatır.

const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(config.port, () => {
      console.log(`Server is listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
