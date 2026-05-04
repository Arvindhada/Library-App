const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
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
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    enum: ['UPI', 'Cash', 'Card', 'Other'],
    default: 'Cash',
  },
  note: {
    type: String,
    default: '',
  },
  paidDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

paymentSchema.index({ library: 1, paidDate: -1 });
paymentSchema.index({ student: 1 });
paymentSchema.index({ booking: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
