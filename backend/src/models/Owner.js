const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  authProvider: { type: String, enum: ['phone', 'google'], default: 'phone' },
  role: { type: String, default: 'owner' }, // keeping for frontend compatibility
  name: { type: String, default: '' },
  photo: { type: String, default: null },
  upi_id: { type: String, default: '' }, // Payment ID for Owners
  library: { type: mongoose.Schema.Types.ObjectId, ref: 'Library' }, // Reference to their library
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }] // Reference to students in their library
}, { timestamps: true });

module.exports = mongoose.model('Owner', ownerSchema);
