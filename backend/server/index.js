// server/index.js

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');

const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const blogRoutes = require('./routes/blogs');

const app = express();

// CORS: only the configured frontend origin may call the API
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Pet Care API running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/blogs', blogRoutes);

// Fallback error handler for anything a route did not catch
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

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
