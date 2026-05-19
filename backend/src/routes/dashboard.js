const express = require('express');
const Booking = require('../models/Booking');
const Library = require('../models/Library');
const Payment = require('../models/Payment');
const { protect } = require('../middlewares/authMiddleware');
const AppError = require('../utils/AppError');
const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get complete dashboard stats for the owner
 * @access  Private (Owner only)
 */
router.get('/stats', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'owner') {
      return next(new AppError('Access denied. Owners only.', 403));
    }

    const library = await Library.findOne({ owner_id: req.user._id });
    if (!library) {
      return res.json({
        success: true,
        hasLibrary: false,
        message: 'No library registered yet.',
      });
    }

    const libraryId = library._id;

    const allBookings = await Booking.find({ library: libraryId })
      .populate('student', 'name phone photo city studyGoal email')
      .sort({ createdAt: -1 });

    const activeBookings = allBookings.filter(b => b.status === 'Active');
    const pendingBookings = allBookings.filter(b => b.status === 'Pending');
    const duePaymentBookings = allBookings.filter(
      b => b.status === 'Active' && b.paymentStatus === 'Pending'
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const payments = await Payment.find({ library: libraryId, status: 'Paid' });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const todayRevenue = payments
      .filter(p => {
        const paidDate = new Date(p.paidAt || p.createdAt);
        return paidDate >= today && paidDate < tomorrow;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const monthlyRevenue = payments
      .filter(p => {
        const paidDate = new Date(p.paidAt || p.createdAt);
        return paidDate >= thisMonthStart;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const seatMap = {};
    activeBookings.forEach(b => {
      if (b.seat) {
        seatMap[String(b.seat)] = {
          libraryName: library.name,
          ownerId: req.user._id,
          ownerName: req.user.name,
          studentId: b.student?._id,
          name: b.student?.name || 'Unknown',
          phone: b.student?.phone || '',
          photo: b.student?.photo || null,
          shift: b.shift,
          startDate: b.startDate,
          endDate: b.endDate,
          paymentStatus: b.paymentStatus,
          bookingId: b._id,
          amount: b.amount,
        };
      }
    });

    const monthlyBreakdown = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      
      const mAmount = payments
        .filter(p => {
          const pDate = new Date(p.paidAt || p.createdAt);
          return pDate >= mStart && pDate <= mEnd;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      monthlyBreakdown.push({
        month: mStart.toLocaleString('default', { month: 'short' }),
        year: mStart.getFullYear(),
        amount: mAmount
      });
    }

    const fiveDaysLater = new Date();
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
    const expiringSoon = activeBookings.filter(b => {
      const end = new Date(b.endDate);
      return end >= today && end <= fiveDaysLater;
    });

    // ==========================================
    // SECTION 8: Construct & Send Final Payload
    // ==========================================
    res.json({
      success: true,
      hasLibrary: true,
      library: {
        _id: library._id,
        name: library.name,
        address: library.address,
        total_seats: library.total_seats,
        available_seats: library.available_seats,
        area: library.area,
        photos: library.photos,
        whatsapp: library.whatsapp,
        open_time: library.open_time,
        half_time_fee: library.half_time_fee,
        full_time_fee: library.full_time_fee,
        facilities: library.facilities,
      },
      stats: {
        totalSeats: library.total_seats,
        occupiedSeats: activeBookings.length,
        freeSeats: library.available_seats,
        occupancyPercent: library.total_seats > 0
          ? Math.round((activeBookings.length / library.total_seats) * 100)
          : 0,
        pendingRequests: pendingBookings.length,   // New join requests
        duePayments: duePaymentBookings.length,    // Students who haven't paid
        expiringSoon: expiringSoon.length,         // Bookings ending in 5 days
      },
      revenue: {
        today: todayRevenue,
        thisMonth: monthlyRevenue,
        total: totalRevenue,
        breakdown: monthlyBreakdown.reverse(),
      },
      seatMap,
      recentBookings: allBookings.slice(0, 100),
      activeBookings: activeBookings.slice(0, 100),
      pendingBookings,
      duePaymentBookings: duePaymentBookings.slice(0, 100),
      expiringSoonBookings: expiringSoon,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/dashboard/booking/:id/mark-paid
 * @desc    Owner marks a student's payment as Paid and records the amount
 * @access  Private (Owner only)
 */
router.patch('/booking/:id/mark-paid', protect, async (req, res, next) => {
  try {
    const { amount } = req.body;
    const booking = await Booking.findById(req.params.id).populate('library');

    if (!booking) return next(new AppError('Booking not found', 404));

    // Security: only the library owner can mark payment
    const library = booking.library; // already populated above
    if (!library || library.owner_id.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    booking.paymentStatus = 'Paid';
    if (amount) booking.amount = Number(amount);
    await booking.save();

    res.json({ success: true, booking, message: 'Payment marked as Paid ✓' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/dashboard/booking/:id/add-note
 * @desc    Owner adds a note to a booking (e.g. "Student called for renewal")
 * @access  Private (Owner only)
 */
router.patch('/booking/:id/add-note', protect, async (req, res, next) => {
  try {
    const { notes } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { notes },
      { new: true }
    );
    if (!booking) return next(new AppError('Booking not found', 404));
    res.json({ success: true, booking, message: 'Note saved' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
