const express = require('express');
const Booking = require('../models/Booking');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createBookingSchema, updateBookingStatusSchema } = require('../validations/bookingSchemas');
const AppError = require('../utils/AppError');
const Student = require('../models/Student');
const Owner = require('../models/Owner');
const router = express.Router();

// @route   POST /api/bookings
// @desc    Student requests to book a seat
// @access  Private
router.post('/', protect, validate(createBookingSchema), async (req, res, next) => {
  try {
    const { libraryId, startDate, endDate, shift, seat } = req.body;

    const library = await Library.findById(libraryId);
    if (!library) return next(new AppError('Library not found', 404));

    if (library.available_seats <= 0) {
      return next(new AppError('Sorry, no general seats available in this library.', 400));
    }

    const studentExistingBooking = await Booking.findOne({
      student: req.user._id,
      status: { $in: ['Active', 'Pending'] }
    });
    if (studentExistingBooking) {
      return next(new AppError('Aapke paas pehle se hi ek active ya pending booking hai. Aap ek waqt mein sirf ek hi seat book kar sakte hain.', 400));
    }

    if (seat) {
      const existingBooking = await Booking.findOne({
        library: libraryId,
        seat: seat,
        status: { $in: ['Active', 'Pending'] },
        $or: [
          { shift: 'Full Day' },
          { $expr: { $eq: [shift, 'Full Day'] } },
          { shift: shift }
        ],
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) }
      });

      if (existingBooking) {
        return next(new AppError(`Seat ${seat} is already booked for this time/shift. Please choose another seat or shift.`, 400));
      }
    }

    const booking = await Booking.create({
      student: req.user._id,
      library: libraryId,
      owner: library.owner_id, // Link to the owner of this library
      startDate,
      endDate,
      shift,
      seat,
    });

    // Decrease available seats count
    await Library.findByIdAndUpdate(libraryId, {
      $inc: { available_seats: -1 }
    });

    // Add explicit reference to Student's bookings array
    await Student.findByIdAndUpdate(req.user._id, { $addToSet: { bookings: booking._id } });

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
      .populate('library', 'name address area whatsapp photos')
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
      .populate('student', 'phone name photo city studyGoal email')
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
    const { status, seat } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(new AppError('Booking not found', 404));

    if (seat) {
      // Collision Check 1: Ensure student doesn't already have another Active seat
      const studentExisting = await Booking.findOne({
        library: booking.library,
        student: booking.student,
        status: 'Active',
        _id: { $ne: booking._id }
      });
      if (studentExisting) {
        return next(new AppError(`Student ke paas pehle se hi ek active seat (${studentExisting.seat}) hai.`, 400));
      }

      // Collision Check 2: Ensure seat is not already taken by another Active booking
      const existing = await Booking.findOne({
        library: booking.library,
        seat: seat,
        status: 'Active',
        _id: { $ne: booking._id } // Not this booking itself
      });
      if (existing) {
        return next(new AppError(`Seat ${seat} is already occupied.`, 400));
      }
      booking.seat = seat;
    }

    const prevStatus = booking.status;
    booking.status = status;
    const savedBooking = await booking.save();

    // Auto seat management
    const library = await Library.findById(booking.library);
    if (library) {
      // Only decrement when going from Pending → Active (seat was already decremented on booking creation)
      // But if owner directly sets Active (skipping Pending), also decrement
      if (status === 'Active' && prevStatus === 'Pending') {
        // Seat was already reserved at booking creation — no need to decrement again
        // Add student to the Owner's explicit student array reference
        await Owner.findOneAndUpdate(
          { library: booking.library },
          { $addToSet: { students: booking.student } }
        );
      } else if ((status === 'Rejected' || status === 'Expired') && prevStatus !== 'Pending') {
        // Only restore seat if booking was Active (i.e., seat was consumed)
        library.available_seats = Math.min(
          library.total_seats,
          (library.available_seats || 0) + 1
        );
        await library.save();
      } else if ((status === 'Rejected') && prevStatus === 'Pending') {
        // Booking was Pending → Rejected: restore the seat reserved at creation
        library.available_seats = Math.min(
          library.total_seats,
          (library.available_seats || 0) + 1
        );
        await library.save();
      }
    }

    res.json({ success: true, booking, message: `Booking marked as ${status}` });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bookings/owner/add-student
// @desc    Owner manually adds a student to their library
// @access  Private
router.post('/owner/add-student', protect, async (req, res, next) => {
  try {
    const { phone, name, libraryId, seat, shift, fee } = req.body;

    if (!phone || !libraryId || !seat) {
      return next(new AppError('Phone, Library ID and Seat are required.', 400));
    }

    const library = await Library.findById(libraryId);
    if (!library) {
      return next(new AppError('Library not found', 404));
    }

    // Find or create student
    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    
    let student = await Student.findOne({ phone: normalizedPhone });
    if (!student) {
      student = await Student.create({ phone: normalizedPhone, name: name || '', role: 'student' });
    } else if (name && !student.name) {
      student.name = name;
      await student.save();
    }

    // Step 0: Check if student already has an Active seat here
    const studentExisting = await Booking.findOne({
      library: libraryId,
      student: student._id,
      status: 'Active'
    });
    if (studentExisting) {
      return next(new AppError(`Student ke paas pehle se hi ek active seat (${studentExisting.seat}) hai.`, 400));
    }

    const booking = await Booking.create({
      student: student._id,
      library: libraryId,
      owner: req.user._id, // Hierarchy: Library -> Owner -> Student
      seat,
      shift: shift || 'Full Day',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'Active',
      amount: (fee && !isNaN(fee)) ? Number(fee) : 0,
    });

    // Update references
    await Student.findByIdAndUpdate(student._id, { $addToSet: { bookings: booking._id } });
    
    await Owner.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { students: student._id } }
    );

    await Library.findByIdAndUpdate(libraryId, { $inc: { available_seats: -1 } });

    res.status(201).json({ success: true, booking, message: 'Student added successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
