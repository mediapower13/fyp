const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // hash it
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  hasVoted: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);
