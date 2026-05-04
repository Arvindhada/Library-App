const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  role: { type: String, default: 'owner' }, // keeping for frontend compatibility
  name: { type: String, default: '' },
  photo: { type: String, default: null },
  upi_id: { type: String, default: '' }, // Payment ID for Owners
}, { timestamps: true });

module.exports = mongoose.model('Owner', ownerSchema);
