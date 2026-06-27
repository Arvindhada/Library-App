const express = require('express');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/libraries/my-library
// @desc    Get the library owned by the logged-in user
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.get('/my-library', protect, async (req, res, next) => {
  try {
    const library = await Library.findOne({ owner_id: req.user._id });
    res.json(library || null);
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/libraries/search?q=keyword
// @desc    Search libraries by name, area, or address
// @access  Public
// ─────────────────────────────────────────────────────────────────
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);

    const results = await Library.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(20);

    // Fallback: regex search if text index not hit
    if (results.length === 0) {
      const regex = new RegExp(q, 'i');
      const fallback = await Library.find({
        $or: [{ name: regex }, { area: regex }, { address: regex }]
      }).limit(20);
      return res.json(fallback);
    }

    res.json(results);
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/libraries
// @desc    Get all libraries (with optional query filters)
//          Query: ?area=Jaipur&minFee=500&maxFee=1500&hasWifi=true&hasAC=true
// @access  Public
// ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.area)    filter.area    = new RegExp(req.query.area, 'i');
    if (req.query.hasWifi === 'true') filter.wifi_available = true;
    if (req.query.hasAC   === 'true') filter.ac_available   = true;

    const libraries = await Library.find(filter).sort({ createdAt: -1 });
    res.json(libraries);
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/libraries/:id
// @desc    Get single library by ID
// @access  Public
// ─────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const library = await Library.findById(req.params.id);
    if (!library) { res.status(404); throw new Error('Library not found'); }
    res.json(library);
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/libraries
// @desc    Owner creates/registers their library
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const existing = await Library.findOne({ owner_id: req.user._id });
    if (existing) { res.status(400); throw new Error('You already have a library registered.'); }

    const libraryData = { ...req.body, owner_id: req.user._id };

    // Sync alias fields
    if (!libraryData.totalSeats && libraryData.total_seats) {
      libraryData.totalSeats  = libraryData.total_seats;
      libraryData.vacantSeats = libraryData.available_seats ?? libraryData.total_seats;
    }
    if (!libraryData.available_seats && libraryData.total_seats) {
      libraryData.available_seats = libraryData.total_seats;
    }

    const library = await Library.create(libraryData);
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { role: 'owner' });
    res.status(201).json(library);
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/libraries/:id
// @desc    Owner updates their library
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res, next) => {
  try {
    const library = await Library.findOne({ _id: req.params.id, owner_id: req.user._id });
    if (!library) { res.status(404); throw new Error('Library not found or you are not the owner.'); }

    const updates = { ...req.body };

    // Keep alias fields in sync
    if (updates.total_seats !== undefined) {
      updates.totalSeats = updates.total_seats;
    }
    if (updates.halfTime?.fee !== undefined) {
      updates.half_time_fee = updates.halfTime.fee;
    }
    if (updates.fullTime?.fee !== undefined) {
      updates.full_time_fee = updates.fullTime.fee;
    }

    const updated = await Library.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: false });
    res.json(updated);
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   DELETE /api/libraries/:id
// @desc    Owner deletes their library
// @access  Private (Owner)
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const library = await Library.findOne({ _id: req.params.id, owner_id: req.user._id });
    if (!library) { res.status(404); throw new Error('Library not found or not authorized.'); }

    await Library.findByIdAndDelete(req.params.id);

    // Also remove all bookings for this library
    const Booking = require('../models/Booking');
    await Booking.deleteMany({ library: req.params.id });

    res.json({ success: true, message: 'Library and all associated bookings deleted.' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/libraries/save
// @desc    Student saves a library
// @access  Private (Student)
// ─────────────────────────────────────────────────────────────────
router.post('/save', protect, async (req, res, next) => {
  try {
    const { libraryId } = req.body;
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedLibraries: libraryId } });
    res.json({ success: true, message: 'Library saved' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/libraries/unsave
// @desc    Student removes library from saved
// @access  Private (Student)
// ─────────────────────────────────────────────────────────────────
router.post('/unsave', protect, async (req, res, next) => {
  try {
    const { libraryId } = req.body;
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { $pull: { savedLibraries: libraryId } });
    res.json({ success: true, message: 'Library unsaved' });
  } catch (error) { next(error); }
});

module.exports = router;
