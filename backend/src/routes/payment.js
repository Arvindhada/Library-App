const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middlewares/authMiddleware');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order for a booking
// @access  Private
router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { amount, bookingId } = req.body;

    if (!amount || !bookingId) {
      return next(new AppError('Amount and Booking ID are required', 400));
    }

    const options = {
      amount: amount * 100, // Amount in paise (100 paise = 1 INR)
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
    });
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
      // Payment is verified
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'Paid',
      });

      res.json({
        success: true,
        message: 'Payment verified and booking updated!',
      });
    } else {
      return next(new AppError('Invalid payment signature!', 400));
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
