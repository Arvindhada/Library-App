const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  role: { type: String, default: 'student' }, // keeping for frontend compatibility
  name: { type: String, default: '' },
  photo: { type: String, default: null },
  savedLibraries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Library' }]
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
