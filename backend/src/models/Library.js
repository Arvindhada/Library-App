const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  total_seats: { type: Number, required: true },
  available_seats: { type: Number, required: true },
  ac_available: { type: Boolean, default: false },
  wifi_available: { type: Boolean, default: false },
  area: { type: String },
  city: { type: String, default: 'Jaipur' },
  lat: { type: Number },
  lng: { type: Number },
  whatsapp: { type: String },
  open_time: { type: String },
  half_time_fee: { type: Number },
  full_time_fee: { type: Number },
  facilities: [{ type: String }],
  photos: [{ type: String }],
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }
}, { timestamps: true });

librarySchema.index({ name: 'text', area: 'text' }); // Fast search by name/area
librarySchema.index({ owner_id: 1 });

module.exports = mongoose.model('Library', librarySchema);
