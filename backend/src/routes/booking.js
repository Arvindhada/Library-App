const express = require('express');
const Booking = require('../models/Booking');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// @route   POST /api/bookings
// @desc    Student requests to book a seat
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { libraryId, startDate, endDate, shift, seat } = req.body;

    const library = await Library.findById(libraryId);
    if (!library) { res.status(404); throw new Error('Library not found'); }
    if (library.available_seats <= 0) { res.status(400); throw new Error('No seats available in this library'); }

    const booking = await Booking.create({ student: req.user._id, library: libraryId, startDate, endDate, shift, seat });
    res.status(201).json({ success: true, booking, message: 'Booking request sent. Waiting for owner approval.' });
  } catch (error) { next(error); }
});

// @route   GET /api/bookings/me
// @desc    Get logged-in user's bookings
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ student: req.user._id }).populate('library', 'name address');
    res.json({ success: true, bookings });
  } catch (error) { next(error); }
});

// @route   GET /api/bookings/library/:libraryId
// @desc    Owner views bookings for their library (owner only)
// @access  Private
router.get('/library/:libraryId', protect, async (req, res, next) => {
  try {
    const library = await Library.findById(req.params.libraryId);
    if (!library) { res.status(404); throw new Error('Library not found'); }

    // Security: only library owner can view bookings
    if (library.owner_id && library.owner_id.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized to view these bookings');
    }

    const bookings = await Booking.find({ library: req.params.libraryId }).populate('student', 'phone name');
    res.json({ success: true, bookings });
  } catch (error) { next(error); }
});

// @route   PUT /api/bookings/:id/status
// @desc    Owner accepts/rejects a booking — auto adjusts seat count
// @access  Private
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) { res.status(404); throw new Error('Booking not found'); }

    const prevStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Auto seat management
    const library = await Library.findById(booking.library);
    if (library) {
      if (status === 'Active' && prevStatus === 'Pending') {
        library.available_seats = Math.max(0, (library.available_seats || 0) - 1);
      } else if ((status === 'Rejected' || status === 'Cancelled') && prevStatus === 'Active') {
        library.available_seats = (library.available_seats || 0) + 1;
      }
      await library.save();
    }

    res.json({ success: true, booking, message: `Booking marked as ${status}` });
  } catch (error) { next(error); }
});

// @route   POST /api/bookings/owner/add-student
// @desc    Owner manually adds a student to their library
// @access  Private
router.post('/owner/add-student', protect, async (req, res, next) => {
  try {
    const { name, phone, seat, shift, startDate, endDate, libraryId } = req.body;
    const User = require('../models/User');

    // 1. Find or Create Student User
    let student = await User.findOne({ phone: phone.includes('+91') ? phone : `+91${phone}` });
    if (!student) {
      student = await User.create({
        name,
        phone: phone.includes('+91') ? phone : `+91${phone}`,
        role: 'student'
      });
    }

    // 2. Check if seat is already taken in this library
    const existing = await Booking.findOne({ library: libraryId, seat, status: 'Active' });
    if (existing) {
      res.status(400);
      throw new Error(`Seat ${seat} is already occupied.`);
    }

    // 3. Create Active Booking
    const booking = await Booking.create({
      student: student._id,
      library: libraryId,
      seat,
      shift,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'Active',
      gender: req.body.gender || 'Male',
      address: req.body.address || '',
      fee: req.body.fee || 0,
      admissionDate: req.body.admissionDate || new Date().toISOString().split('T')[0],
    });

    // 4. Update library available seats
    const library = await Library.findById(libraryId);
    if (library) {
      library.available_seats = Math.max(0, (library.available_seats || 0) - 1);
      await library.save();
    }

    // 5. Return booking with student info populated
    const populated = await Booking.findById(booking._id).populate('student', 'name phone');
    res.status(201).json({ success: true, booking: populated, message: 'Student added successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Owner deletes/removes a student booking
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) { res.status(404); throw new Error('Booking not found'); }

    // Restore seat count
    const library = await Library.findById(booking.library);
    if (library && booking.status === 'Active') {
      library.available_seats = (library.available_seats || 0) + 1;
      await library.save();
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking removed successfully' });
  } catch (error) { next(error); }
});

module.exports = router;
