const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  library: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true,
  },
  seat: {
    type: String,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  shift: {
    type: String,
    enum: ['Morning', 'Evening', 'Full Day', 'Half Time'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Rejected', 'Expired'],
    default: 'Pending',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
  },
  amount: {
    type: Number, // Fee charged for this booking (in INR)
    default: 0,
  },
  notes: {
    type: String, // Owner can add a note (e.g. "Paid cash", "Renew reminder")
    default: '',
  }
}, { timestamps: true });

bookingSchema.index({ library: 1, status: 1 });
bookingSchema.index({ student: 1 });
bookingSchema.index({ createdAt: -1 }); // Fast sorting for recent activity

// CRITICAL: Prevent same seat being 'Active' twice in the same library for the SAME SHIFT.
// Note: We use shift in the index so Seat 1 can be Active for Morning AND Evening simultaneously.
bookingSchema.index(
  { library: 1, seat: 1, shift: 1, status: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: 'Active',
      seat: { $type: "string" } // Only enforce if seat is a string (not null/empty)
    } 
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
