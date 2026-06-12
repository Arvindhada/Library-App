const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  // Basic Info
  name:        { type: String, required: true, trim: true },
  address:     { type: String, required: true },
  description: { type: String, default: '' },
  phone:       { type: String, default: '' },
  area:        { type: String, default: '' },
  whatsapp:    { type: String, default: '' },

  // Seats
  total_seats:     { type: Number, required: true, default: 0 },
  available_seats: { type: Number, required: true, default: 0 },
  totalSeats:      { type: Number, default: 0 },    // alias used by frontend
  vacantSeats:     { type: Number, default: 0 },    // alias used by frontend
  bookedSeats:     { type: Number, default: 0 },

  // Timing
  timings:     { type: String, default: '6 AM – 10 PM' },
  open_time:   { type: String, default: '' },
  close_time:  { type: String, default: '' },
  isOpen24hrs: { type: Boolean, default: false },

  // Fees — Frontend-compatible nested format
  halfTime: {
    fee:  { type: Number, default: 0 },
    time: { type: String, default: '' },
  },
  fullTime: {
    fee:  { type: Number, default: 0 },
    time: { type: String, default: '' },
  },

  // Old flat fee fields (backward compat)
  half_time_fee: { type: Number, default: 0 },
  full_time_fee: { type: Number, default: 0 },

  // Amenities
  ac_available:   { type: Boolean, default: false },
  wifi_available: { type: Boolean, default: false },
  facilities:     [{ type: String }],
  photos:         [{ type: String }],

  // Location
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },

  // Meta
  rating:   { type: Number, default: 4.5 },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

// Indexes for fast search
librarySchema.index({ name: 'text', area: 'text', address: 'text' });

// Pre-save: keep frontend-facing aliases in sync
librarySchema.pre('save', function () {
  this.totalSeats  = this.total_seats;
  this.vacantSeats = this.available_seats;
  this.bookedSeats = this.total_seats - this.available_seats;
  if (this.halfTime?.fee) this.half_time_fee = this.halfTime.fee;
  if (this.fullTime?.fee) this.full_time_fee = this.fullTime.fee;
});

module.exports = mongoose.model('Library', librarySchema);
