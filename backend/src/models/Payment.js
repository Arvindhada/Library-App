const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
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
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    enum: ['UPI', 'Cash', 'Card', 'Online', 'Bank Transfer', 'Other'],
    default: 'Cash',
  },
  status: {
    type: String,
    enum: ['Paid', 'Missed', 'Pending'],
    default: 'Paid',
  },
  note: {
    type: String,
    default: '',
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

paymentSchema.index({ library: 1, paidAt: -1 });
paymentSchema.index({ student: 1 });
paymentSchema.index({ booking: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
