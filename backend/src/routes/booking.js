const express = require('express');
const Booking = require('../models/Booking');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createBookingSchema, updateBookingStatusSchema } = require('../validations/bookingSchemas');
const AppError = require('../utils/AppError');
const router = express.Router();

// @route   POST /api/bookings
// @desc    Student requests to book a seat
// @access  Private
router.post('/', protect, validate(createBookingSchema), async (req, res, next) => {
  try {
    const { libraryId, startDate, endDate, shift, seat } = req.body;

    const library = await Library.findById(libraryId);
    if (!library) return next(new AppError('Library not found', 404));
    
    // 1. Basic Seat Availability Check (Count-based)
    if (library.available_seats <= 0) {
      return next(new AppError('Sorry, no general seats available in this library.', 400));
    }

    // 2. Seat Collision Logic (Specific Seat Check)
    if (seat) {
      // Find any Active/Pending booking that overlaps with these dates AND shift AND same seat
      const existingBooking = await Booking.findOne({
        library: libraryId,
        seat: seat,
        status: { $in: ['Active', 'Pending'] },
        $or: [
          // Case 1: Existing booking is 'Full Day' (blocks all shifts)
          { shift: 'Full Day' },
          // Case 2: New booking is 'Full Day' (blocks all existing shifts)
          { $expr: { $eq: [shift, 'Full Day'] } },
          // Case 3: Same shift
          { shift: shift }
        ],
        // Date Overlap Logic: (StartA <= EndB) AND (EndA >= StartB)
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) }
      });

      if (existingBooking) {
        return next(new AppError(`Seat ${seat} is already booked for this time/shift. Please choose another seat or shift.`, 400));
      }
    }

    // 3. Create Booking
    const booking = await Booking.create({
      student: req.user._id,
      library: libraryId,
      startDate,
      endDate,
      shift,
      seat,
    });

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking request sent. Waiting for owner approval.',
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/me
// @desc    Get logged-in user's bookings with pagination
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments({ student: req.user._id });
    const bookings = await Booking.find({ student: req.user._id })
      .populate('library', 'name address area')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      bookings,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/library/:libraryId
// @desc    Owner views bookings for their library with pagination & status filter
// @access  Private
router.get('/library/:libraryId', protect, async (req, res, next) => {
  try {
    const library = await Library.findById(req.params.libraryId);
    if (!library) return next(new AppError('Library not found', 404));

    // Security: only library owner can view bookings
    if (library.owner_id && library.owner_id.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to view these bookings', 403));
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Optional: filter by status e.g. ?status=Pending
    const filter = { library: req.params.libraryId };
    if (req.query.status && ['Pending', 'Active', 'Rejected', 'Expired'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('student', 'phone name photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      bookings,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Owner accepts/rejects a booking — auto adjusts seat count
// @access  Private
router.put('/:id/status', protect, validate(updateBookingStatusSchema), async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new AppError('Booking not found', 404));

    const prevStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Auto seat management
    const library = await Library.findById(booking.library);
    if (library) {
      if (status === 'Active' && prevStatus === 'Pending') {
        library.available_seats = Math.max(0, (library.available_seats || 0) - 1);
      } else if ((status === 'Rejected' || status === 'Expired') && prevStatus === 'Active') {
        library.available_seats = (library.available_seats || 0) + 1;
      }
      await library.save();
    }

    res.json({ success: true, booking, message: `Booking marked as ${status}` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
