const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/payments
// @desc    Get payments (can filter by bookingId)
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const { bookingId } = req.query;
    let query = {};

    const library = await Library.findOne({ owner_id: req.user._id });
    if (!library) return res.json({ success: true, payments: [] });

    query.library = library._id;

    if (bookingId) {
      query.booking = bookingId;
    }

    const payments = await Payment.find(query)
      .populate('student', 'name phone')
      .populate('booking', 'seat shift')
      .sort({ paidDate: -1 });

    res.json({ success: true, payments });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/payments
// @desc    Record a payment for a student booking (owner collects)
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { bookingId, amount, method, note, studentName, shift } = req.body;

    if (!bookingId || !amount) {
      res.status(400); throw new Error('bookingId and amount are required');
    }

    const booking = await Booking.findById(bookingId).populate('student');
    if (!booking) { res.status(404); throw new Error('Booking not found'); }

    // Verify owner
    const library = await Library.findOne({ _id: booking.library, owner_id: req.user._id });
    if (!library) { res.status(403); throw new Error('Not authorized — you do not own this library'); }

    // Create payment record — include studentName & shift for revenue history
    const payment = await Payment.create({
      booking:     bookingId,
      student:     booking.student._id,
      library:     booking.library,
      amount:      Number(amount),
      method:      method      || 'Cash',
      note:        note        || '',
      studentName: studentName || booking.student?.name || '',
      shift:       shift       || booking.shift || '',
      category:    'student_fee',
      paidDate:    new Date(),
    });

    // Extend booking end date by 30 days from today or current expiry, whichever is later
    const today      = new Date();
    const currentEnd = new Date(booking.endDate);
    const baseDate   = currentEnd > today ? currentEnd : today;
    const newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + 30);

    await Booking.findByIdAndUpdate(bookingId, {
      endDate: newEndDate,
      status:  'Active',
      isPaid:  true,
      paymentStatus: 'Paid',
    });

    res.status(201).json({
      success: true,
      payment,
      newEndDate,
      message: 'Payment recorded and booking renewed for 30 days.',
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/payments/expense
// @desc    Record an expense for the library (owner creates)
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.post('/expense', protect, async (req, res, next) => {
  try {
    const { amount, category, method, note } = req.body;

    if (!amount || !category) {
      res.status(400); throw new Error('Amount and Category are required');
    }

    const library = await Library.findOne({ owner_id: req.user._id });
    if (!library) { res.status(403); throw new Error('Not authorized — you do not own a library'); }

    const payment = await Payment.create({
      type: 'expense',
      library: library._id,
      amount:  Number(amount),
      category,
      method:  method || 'Cash',
      note:    note   || '',
      paidDate: new Date(),
    });

    res.status(201).json({
      success: true,
      payment,
      message: 'Expense recorded successfully.',
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/payments/me
// @desc    Get all payments for the logged-in owner's library
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const library = await Library.findOne({ owner_id: req.user._id });
    if (!library) return res.json({ success: true, payments: [] });

    const payments = await Payment.find({ library: library._id })
      .populate('student', 'name phone')
      .populate('booking', 'seat shift')
      .sort({ paidDate: -1 });

    res.json({ success: true, payments });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/payments/library/:libraryId
// @desc    Get all payments for a specific library
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.get('/library/:libraryId', protect, async (req, res, next) => {
  try {
    const library = await Library.findOne({ _id: req.params.libraryId, owner_id: req.user._id });
    if (!library) { res.status(403); throw new Error('Not authorized'); }

    const payments = await Payment.find({ library: req.params.libraryId })
      .populate('student', 'name phone')
      .populate('booking', 'seat shift')
      .sort({ paidDate: -1 });

    res.json({ success: true, payments });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/payments/summary
// @desc    Get revenue summary for the owner (monthly breakdown)
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.get('/summary', protect, async (req, res, next) => {
  try {
    const library = await Library.findOne({ owner_id: req.user._id });
    if (!library) return res.json({ success: true, summary: {} });

    const now       = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthPayments = await Payment.find({
      library: library._id,
      paidDate: { $gte: startMonth, $lte: endMonth },
    });

    const totalRevenue   = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalThisMonth = monthPayments.length;

    // Today's revenue
    const todayStr   = now.toISOString().split('T')[0];
    const todayStart = new Date(todayStr);
    const todayEnd   = new Date(todayStr + 'T23:59:59');
    const todayPayments = await Payment.find({
      library: library._id,
      paidDate: { $gte: todayStart, $lte: todayEnd },
    });
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      summary: {
        monthlyRevenue: totalRevenue,
        monthlyPayments: totalThisMonth,
        todayRevenue,
        todayPayments: todayPayments.length,
      }
    });
  } catch (error) { next(error); }
});

module.exports = router;
