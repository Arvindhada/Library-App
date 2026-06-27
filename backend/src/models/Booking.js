const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  library: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    required: true,
  },
  seat: { type: String },
  startDate: { type: Date, required: true, default: Date.now },
  endDate:   { type: Date, required: true, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  shift: {
    type: String,
    enum: ['Half Time', 'Full Time', 'Morning', 'Evening', 'Full Day'],
    default: 'Full Time',
  },
  status: {
    type: String,
    // Requested = student asked to join (pending owner approval)
    // Pending   = owner accepted, fee not yet collected
    // Active    = fee paid, seat active
    // Rejected  = owner rejected request
    // Expired   = booking lapsed
    // Cancelled = manually cancelled
    enum: ['Requested', 'Pending', 'Active', 'Rejected', 'Expired', 'Cancelled', 'Inactive'],
    default: 'Requested',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
  },
  isPaid: { type: Boolean, default: false },

  // Extra fields for owner-added students
  studentName:   { type: String }, // Local copy to prevent overwriting global user
  studentPhone:  { type: String }, // Local copy of phone
  gender:        { type: String, default: 'Male' },
  address:       { type: String, default: '' },
  fee:           { type: Number, default: 0 },
  admissionDate: { type: String, default: '' },
  note:          { type: String, default: '' },
}, { timestamps: true });

// Indexes
bookingSchema.index({ library: 1, status: 1 });
bookingSchema.index({ student: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ library: 1, seat: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
