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
    enum: ['Half Time', 'Full Time', 'Morning', 'Evening', 'Full Day'],
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
  }
}, { timestamps: true });

bookingSchema.index({ library: 1, status: 1 });
bookingSchema.index({ student: 1 });
bookingSchema.index({ createdAt: -1 }); // Fast sorting for recent activity

module.exports = mongoose.model('Booking', bookingSchema);
