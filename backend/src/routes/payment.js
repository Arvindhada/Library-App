const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middlewares/authMiddleware');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const Library = require('../models/Library');
const Student = require('../models/Student');
const Owner = require('../models/Owner');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST /api/payments/collect
// @desc    Owner manually collects cash/UPI fee from student and records it
// @access  Private
router.post('/collect', protect, async (req, res, next) => {
  try {
    const { bookingId, amount, method } = req.body;

    if (!bookingId || !amount) {
      return next(new AppError('bookingId and amount are required', 400));
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new AppError('Booking not found', 404));

    // Record the payment
    const payment = await Payment.create({
      booking: bookingId,
      student: booking.student,
      library: booking.library,
      amount: Number(amount),
      method: method || 'Cash',
      status: 'Paid',
      paidAt: new Date(),
    });

    // Mark booking as paid, update amount, and extend by 30 days
    const currentEndDate = booking.endDate ? new Date(booking.endDate) : new Date();
    const baseDate = currentEndDate > new Date() ? currentEndDate : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + 1);

    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: 'Paid',
      status: 'Active',
      endDate: newExpiry,
      amount: (amount && !isNaN(amount)) ? Number(amount) : 0,
    });

    res.status(201).json({
      success: true,
      payment,
      message: `₹${amount} collected via ${method || 'Cash'}. Booking renewed for 30 days.`,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/payments
// @desc    Get payment history for a booking or library (Secured)
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { bookingId } = req.query;
    const filter = {};

    // Security: If owner, only show payments for their library
    if (req.user.role === 'owner') {
      const library = await Library.findOne({ owner_id: req.user._id });
      if (!library) return res.json({ success: true, payments: [] });
      filter.library = library._id;
    } 
    // If student, only show their own payments
    else if (req.user.role === 'student') {
      filter.student = req.user._id;
    }

    if (bookingId) filter.booking = bookingId;

    const payments = await Payment.find(filter)
      .populate('student', 'name phone')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/payments/booking/:bookingId
// @desc    Owner removes/cancels a student's booking
// @access  Private
router.delete('/booking/:bookingId', protect, async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }



    // Restore the seat (Cap at total_seats)
    const library = await Library.findById(booking.library);
    if (library) {
      library.available_seats = Math.min(library.total_seats, (library.available_seats || 0) + 1);
      await library.save();
    }

    // Remove booking reference from student
    await Student.findByIdAndUpdate(booking.student, { $pull: { bookings: booking._id } });

    // Remove from owner's students list
    await Owner.findOneAndUpdate(
      { library: booking.library },
      { $pull: { students: booking.student } }
    );

    await Booking.findByIdAndDelete(bookingId);

    res.json({ success: true, message: 'Student removed and seat freed.' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order for online payment
// @access  Private
router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { amount, bookingId } = req.body;
    if (!amount || !bookingId) {
      return next(new AppError('Amount and Booking ID are required', 400));
    }

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    next(new AppError('Razorpay Order Creation Failed: ' + error.message, 500));
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment signature
// @access  Private
router.post('/verify', protect, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'Paid' });
      res.json({ success: true, message: 'Payment verified and booking updated!' });
    } else {
      return next(new AppError('Invalid payment signature!', 400));
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
