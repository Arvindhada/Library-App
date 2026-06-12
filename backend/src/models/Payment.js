const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense'],
    default: 'income',
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
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
    enum: ['UPI', 'Cash', 'Online', 'Card', 'Other'],
    default: 'Cash',
  },
  shift: { type: String, default: '' },
  studentName: { type: String, default: '' },
  category: {
    type: String,
    enum: ['student_fee', 'due_collection', 'rent', 'electricity', 'wifi', 'cleaning', 'other'],
    default: 'student_fee',
  },
  note: { type: String, default: '' },
  paidDate: { type: Date, default: Date.now },
}, { timestamps: true });

paymentSchema.index({ library: 1, paidDate: -1 });
paymentSchema.index({ student: 1 });
paymentSchema.index({ booking: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
