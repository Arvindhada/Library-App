const express = require('express');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { librarySchema, saveLibrarySchema } = require('../validations/librarySchemas');
const AppError = require('../utils/AppError');
const Owner = require('../models/Owner');
const Student = require('../models/Student');
const Booking = require('../models/Booking');
const router = express.Router();

// @route   POST /api/libraries
// @desc    Owner creates a new library
// @access  Private
router.post('/', protect, validate(librarySchema), async (req, res, next) => {
  try {

    const existing = await Library.findOne({ owner_id: req.user._id });
    if (existing) {
      return next(new AppError('You already have a library registered.', 400));
    }

    const library = await Library.create({
      ...req.body,
      owner_id: req.user._id,
      available_seats: req.body.available_seats ?? req.body.total_seats,
    });

    // Link library to Owner
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.user._id, 
      { library: library._id },
      { new: true }
    );

    res.status(201).json({ 
      success: true, 
      library,
      message: 'Library registered successfully' 
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/libraries/my-library
// @desc    Owner gets their own library
// @access  Private
router.get('/my-library', protect, async (req, res, next) => {
  try {
    const library = await Library.findOne({ owner_id: req.user._id });
    if (!library) {
      return res.json({ success: true, library: null, message: 'No library found. Please create one.' });
    }
    res.json({ success: true, library });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/libraries
// @desc    Get all libraries with pagination, search & filters
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Search by name or area (text search)
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Filter by area
    if (req.query.area) {
      filter.area = { $regex: req.query.area, $options: 'i' };
    }

    // Filter by amenities
    if (req.query.ac === 'true') filter.ac_available = true;
    if (req.query.wifi === 'true') filter.wifi_available = true;

    // Filter by available seats
    if (req.query.available === 'true') {
      filter.available_seats = { $gt: 0 };
    }

    // Filter by max fee
    if (req.query.maxFee) {
      filter.full_time_fee = { $lte: parseInt(req.query.maxFee) };
    }

    const total = await Library.countDocuments(filter);
    const libraries = await Library.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      libraries,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/libraries/:id
// @desc    Owner updates their library
// @access  Private
router.put('/:id', protect, validate(librarySchema), async (req, res, next) => {
  try {
    const library = await Library.findOne({ _id: req.params.id, owner_id: req.user._id });
    if (!library) return next(new AppError('Library not found or you are not the owner.', 404));

    const updated = await Library.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, library: updated });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/libraries/save
// @desc    Student saves a library
// @access  Private
router.post('/save', protect, validate(saveLibrarySchema), async (req, res, next) => {
  try {
    const { libraryId } = req.body;
    await Student.findByIdAndUpdate(req.user._id, { $addToSet: { savedLibraries: libraryId } });
    res.json({ success: true, message: 'Library saved' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/libraries/unsave
// @desc    Student removes a saved library
// @access  Private
router.post('/unsave', protect, validate(saveLibrarySchema), async (req, res, next) => {
  try {
    const { libraryId } = req.body;
    await Student.findByIdAndUpdate(req.user._id, { $pull: { savedLibraries: libraryId } });
    res.json({ success: true, message: 'Library unsaved' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/libraries/:id/seats
// @desc    Get live seat occupancy for a library (Public/Student)
// @access  Public
router.get('/:id/seats', async (req, res, next) => {
  try {
    const activeBookings = await Booking.find({ 
      library: req.params.id, 
      status: 'Active' 
    }).select('seat shift');

    const occupancy = {};
    activeBookings.forEach(b => {
      if (b.seat) {
        if (!occupancy[b.seat]) occupancy[b.seat] = [];
        occupancy[b.seat].push(b.shift);
      }
    });

    res.json({ success: true, occupancy });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
