const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const newId = () => new mongoose.Types.ObjectId();
const tokenFor = (userId) => jwt.sign({ userId: String(userId) }, process.env.JWT_SECRET);

module.exports = { newId, tokenFor };
