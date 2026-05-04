const express = require('express');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { librarySchema, saveLibrarySchema } = require('../validations/librarySchemas');
const AppError = require('../utils/AppError');
const router = express.Router();

// @route   POST /api/libraries
// @desc    Owner creates a new library
// @access  Private
router.post('/', protect, validate(librarySchema), async (req, res, next) => {
  try {
    const existing = await Library.findOne({ owner_id: req.user._id });
    if (existing) return next(new AppError('You already have a library registered.', 400));

    const library = await Library.create({
      ...req.body,
      owner_id: req.user._id,
      available_seats: req.body.available_seats ?? req.body.total_seats, // default to total
    });
    res.status(201).json({ success: true, library });
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
// @access  Public
router.post('/save', validate(saveLibrarySchema), async (req, res, next) => {
  try {
    const { userId, libraryId } = req.body;
    const Student = require('../models/Student');
    await Student.findByIdAndUpdate(userId, { $addToSet: { savedLibraries: libraryId } });
    res.json({ success: true, message: 'Library saved' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/libraries/unsave
// @desc    Student removes a saved library
// @access  Public
router.post('/unsave', validate(saveLibrarySchema), async (req, res, next) => {
  try {
    const { userId, libraryId } = req.body;
    const Student = require('../models/Student');
    await Student.findByIdAndUpdate(userId, { $pull: { savedLibraries: libraryId } });
    res.json({ success: true, message: 'Library unsaved' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
