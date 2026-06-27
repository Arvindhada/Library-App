const express = require('express');
const Booking = require('../models/Booking');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// Helper: check that req.user owns the library linked to booking
// ─────────────────────────────────────────────────────────────────
async function assertOwner(bookingId, userId, res) {
  const booking = await Booking.findById(bookingId);
  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  const library = await Library.findById(booking.library);
  if (!library || library.owner_id?.toString() !== userId.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  return { booking, library };
}

// Helper: override populated student name/phone with booking-specific local copy
const formatBookings = (bookings) => {
  return bookings.map(b => {
    const bookingObj = b.toObject ? b.toObject() : b;
    if (bookingObj.student) {
      if (bookingObj.studentName) bookingObj.student.name = bookingObj.studentName;
      if (bookingObj.studentPhone) bookingObj.student.phone = bookingObj.studentPhone;
    }
    return bookingObj;
  });
};

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/bookings
// @desc    Student requests to book a seat
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { libraryId, startDate, endDate, shift, seat } = req.body;

    const library = await Library.findById(libraryId);
    if (!library) { res.status(404); throw new Error('Library not found'); }
    if (library.available_seats <= 0) { res.status(400); throw new Error('No seats available'); }

    // Check seat not already taken
    if (seat) {
      const taken = await Booking.findOne({ library: libraryId, seat, status: 'Active' });
      if (taken) { res.status(400); throw new Error(`Seat ${seat} is already occupied`); }
    }

    const booking = await Booking.create({
      student: req.user._id,
      library: libraryId,
      startDate: startDate || new Date(),
      endDate:   endDate   || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      shift:     shift     || 'Full Time',
      seat,
      status: 'Requested',
    });

    res.status(201).json({ success: true, booking, message: 'Booking request sent. Waiting for owner approval.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/bookings/me
// @desc    Get logged-in student's bookings
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate('library', 'name address halfTime fullTime timings');
    res.json({ success: true, bookings });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/bookings/public-seats/:libraryId
// @desc    Get list of occupied/active seat numbers (Public)
// @access  Public
// ─────────────────────────────────────────────────────────────────
router.get('/public-seats/:libraryId', async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      library: req.params.libraryId,
      status: { $in: ['Active', 'Pending'] }
    }, 'seat');
    const occupiedSeats = bookings
      .map(b => parseInt(b.seat, 10))
      .filter(num => !isNaN(num));
    res.json({ success: true, occupiedSeats });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/bookings/library/:libraryId
// @desc    Owner views all bookings for their library
//          Query: ?status=Requested|Active|Pending|Expired
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.get('/library/:libraryId', protect, async (req, res, next) => {
  try {
    const library = await Library.findById(req.params.libraryId);
    if (!library) { res.status(404); throw new Error('Library not found'); }
    if (library.owner_id?.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized');
    }

    const filter = { library: req.params.libraryId };
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate('student', 'name phone photo')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings: formatBookings(bookings) });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/bookings
// @desc    Owner gets all Requested bookings across their library
//          Query: ?status=Requested (used for notification bell)
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    // Find owner's library
    const library = await Library.findOne({ owner_id: req.user._id });
    if (!library) return res.json({ success: true, bookings: [] });

    const filter = { library: library._id };
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate('student', 'name phone photo gender address')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings: formatBookings(bookings) });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/bookings/:id/accept
// @desc    Owner accepts a join request (Requested → Pending/Active)
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.put('/:id/accept', protect, async (req, res, next) => {
  try {
    const { booking, library } = await assertOwner(req.params.id, req.user._id, res);

    // Only decrease seats if not already counted
    const alreadyCounted = ['Pending', 'Active'].includes(booking.status);

    const d = new Date();
    d.setDate(d.getDate() + 2); // 2-day demo period

    booking.status  = 'Pending';   // Pending = accepted but fee not paid yet
    booking.endDate = req.body.endDate || d;
    if (req.body.seat)  booking.seat  = req.body.seat;
    if (req.body.shift) booking.shift = req.body.shift;
    await booking.save();

    // Decrease available seats ONLY if not already counted — use atomic $inc to avoid pre-save hook conflict
    if (!alreadyCounted) {
      const newAvailable = Math.max(0, (library.available_seats || 0) - 1);
      await Library.findByIdAndUpdate(library._id, {
        available_seats: newAvailable,
        vacantSeats:     newAvailable,
        bookedSeats:     (library.total_seats || 0) - newAvailable,
        totalSeats:      library.total_seats || 0,
      });
    }

    const populated = await Booking.findById(booking._id).populate('student', 'name phone photo');
    res.json({ success: true, booking: populated, message: 'Booking accepted (2-Day Demo). Collect fee to activate.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/bookings/:id/reject
// @desc    Owner rejects a join request
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.put('/:id/reject', protect, async (req, res, next) => {
  try {
    const { booking, library } = await assertOwner(req.params.id, req.user._id, res);

    const wasActive = ['Active', 'Pending'].includes(booking.status);
    booking.status = 'Rejected';
    await booking.save();

    // Restore seat count only if was previously active/pending — atomic update
    if (wasActive) {
      const newAvailable = (library.available_seats || 0) + 1;
      await Library.findByIdAndUpdate(library._id, {
        available_seats: newAvailable,
        vacantSeats:     newAvailable,
        bookedSeats:     Math.max(0, (library.total_seats || 0) - newAvailable),
        totalSeats:      library.total_seats || 0,
      });
    }

    res.json({ success: true, message: 'Booking rejected.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/bookings/:id/renew
// @desc    Owner collects fee and renews booking for 30 days
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.put('/:id/renew', protect, async (req, res, next) => {
  try {
    const { booking } = await assertOwner(req.params.id, req.user._id, res);

    const today       = new Date();
    const currentEnd  = new Date(booking.endDate);
    const baseDate    = currentEnd > today ? currentEnd : today;
    const newEndDate  = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + 30);

    booking.status    = 'Active';
    booking.endDate   = newEndDate;
    booking.isPaid    = true;
    booking.paymentStatus = 'Paid';
    await booking.save();

    res.json({ success: true, booking, newEndDate, message: 'Booking renewed for 30 days.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/bookings/:id/status
// @desc    Generic status update (owner)
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) { res.status(404); throw new Error('Booking not found'); }

    const prevStatus = booking.status;
    booking.status   = status;
    await booking.save();

    const library = await Library.findById(booking.library);
    if (library) {
      if (status === 'Active' && prevStatus !== 'Active') {
        library.available_seats = Math.max(0, (library.available_seats || 0) - 1);
      } else if (['Rejected', 'Cancelled', 'Expired'].includes(status) && prevStatus === 'Active') {
        library.available_seats = (library.available_seats || 0) + 1;
      }
      library.vacantSeats = library.available_seats;
      library.bookedSeats = (library.total_seats || 0) - library.available_seats;
      await library.save();
    }

    res.json({ success: true, booking, message: `Booking marked as ${status}` });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/bookings/:id
// @desc    Update booking details (edit student)
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) { res.status(404); throw new Error('Booking not found'); }

    const updatable = ['seat', 'shift', 'endDate', 'gender', 'address', 'fee', 'admissionDate', 'note'];
    updatable.forEach(field => {
      if (req.body[field] !== undefined) booking[field] = req.body[field];
    });
    
    // Update the student's name and phone locally on the booking
    if (req.body.name) booking.studentName = req.body.name;
    if (req.body.phone) booking.studentPhone = req.body.phone;

    await booking.save();

    const populated = await Booking.findById(booking._id).populate('student', 'name phone');
    const formattedBooking = formatBookings([populated])[0];
    res.json({ success: true, booking: formattedBooking, message: 'Booking updated.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/bookings/owner/add-student
// @desc    Owner manually adds a student to their library
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.post('/owner/add-student', protect, async (req, res, next) => {
  try {
    const { name, phone, seat, shift, startDate, endDate, libraryId, gender, address, fee, admissionDate, isPaid } = req.body;
    const User = require('../models/User');

    if (!name || !phone) { res.status(400); throw new Error('Name and phone are required'); }

    // 1. Find or create student user
    const cleanPhone = phone.replace(/\D/g, '');
    const normalizedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : (cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`);
    let student = await User.findOne({ phone: normalizedPhone });
    if (!student) {
      student = await User.create({ name, phone: normalizedPhone, role: 'student' });
    } else {
      // Update name if not set
      if (!student.name && name) { student.name = name; await student.save(); }
    }

    // 2. Check seat availability
    if (seat) {
      const taken = await Booking.findOne({ library: libraryId, seat, status: { $in: ['Active', 'Pending'] } });
      if (taken) { res.status(400); throw new Error(`Seat ${seat} is already occupied.`); }
    }

    // 3. Calculate end date
    const start = startDate ? new Date(startDate) : new Date();
    let end;
    if (endDate) {
      end = new Date(endDate);
    } else {
      end = new Date(start);
      end.setDate(end.getDate() + (isPaid ? 30 : 2));
    }

    // 4. Create booking
    const booking = await Booking.create({
      student: student._id,
      library: libraryId,
      studentName: name,         // Save local copy
      studentPhone: phone,       // Save local copy
      seat,
      shift:     shift     || 'Full Time',
      startDate: start,
      endDate:   end,
      status:    isPaid ? 'Active' : 'Pending',
      paymentStatus: isPaid ? 'Paid' : 'Pending',
      isPaid:    !!isPaid,
      gender:    gender       || 'Male',
      address:   address      || '',
      fee:       Number(fee)  || 0,
      admissionDate: admissionDate || new Date().toISOString().split('T')[0],
    });

    // Create a Payment transaction document on backend if marked as paid during admission
    if (isPaid) {
      try {
        const Payment = require('../models/Payment');
        await Payment.create({
          booking: booking._id,
          student: student._id,
          library: libraryId,
          amount:  Number(fee) || 0,
          method:  'Cash',
          type:    'income',
          category: 'student_fee',
          shift:   shift || 'Full Time',
          studentName: name,
          note:    `New admission — Seat ${seat}`,
          paidDate: start,
        });
      } catch (err) {
        console.error('Failed to create Payment document during admission:', err.message);
      }
    }

    // 5. Update library seat count — atomic to avoid pre-save hook double-subtract
    const library = await Library.findById(libraryId);
    if (library) {
      const newAvailable = Math.max(0, (library.available_seats || 0) - 1);
      await Library.findByIdAndUpdate(libraryId, {
        available_seats: newAvailable,
        vacantSeats:     newAvailable,
        bookedSeats:     (library.total_seats || 0) - newAvailable,
        totalSeats:      library.total_seats || 0,
      });
    }

    const populated = await Booking.findById(booking._id).populate('student', 'name phone');
    res.status(201).json({ success: true, booking: populated, message: 'Student added successfully' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   DELETE /api/bookings/:id
// @desc    Owner removes a student booking
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) { res.status(404); throw new Error('Booking not found'); }

    const library = await Library.findById(booking.library);
    if (library && ['Active', 'Pending'].includes(booking.status)) {
      const newAvailable = (library.available_seats || 0) + 1;
      await Library.findByIdAndUpdate(booking.library, {
        available_seats: newAvailable,
        vacantSeats:     newAvailable,
        bookedSeats:     Math.max(0, (library.total_seats || 0) - newAvailable),
        totalSeats:      library.total_seats || 0,
      });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student booking removed successfully' });
  } catch (error) { next(error); }
});

module.exports = router;
