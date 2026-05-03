const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST /api/payments
// @desc    Record a payment for a student booking
// @access  Private (Owner)
router.post('/', protect, async (req, res, next) => {
  try {
    const { bookingId, amount, method, note } = req.body;

    if (!bookingId || !amount) {
      res.status(400);
      throw new Error('bookingId and amount are required');
    }

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('student');
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Verify owner owns this library (direct query, more reliable)
    const Library = require('../models/Library');
    const library = await Library.findOne({ _id: booking.library, owner_id: req.user._id });
    if (!library) {
      res.status(403);
      throw new Error('Not authorized — you do not own this library');
    }

    // Create payment record
    const payment = await Payment.create({
      booking: bookingId,
      student: booking.student._id,
      library: booking.library,
      amount: Number(amount),
      method: method || 'Cash',
      note: note || '',
      paidDate: new Date(),
    });

    // Extend booking endDate by 30 days
    const today = new Date();
    const currentEnd = new Date(booking.endDate);
    const baseDate = currentEnd < today ? today : currentEnd;
    const newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + 30);

    await Booking.findByIdAndUpdate(bookingId, {
      endDate: newEndDate,
      status: 'Active',
    });

    console.log(`✅ Payment recorded: ₹${amount} for booking ${bookingId}`);

    res.status(201).json({
      success: true,
      payment,
      newEndDate,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    console.error('Payment Error:', error.message);
    next(error);
  }
});

// @route   GET /api/payments/library/:libraryId
// @desc    Get all payments for a library
// @access  Private (Owner)
router.get('/library/:libraryId', protect, async (req, res, next) => {
  try {
    const payments = await Payment.find({ library: req.params.libraryId })
      .populate('student', 'name phone')
      .populate('booking', 'seat shift')
      .sort({ paidDate: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
