const express = require('express');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// @route   GET /api/libraries/my-library
// @desc    Get the library owned by the logged-in user
// @access  Private
router.get('/my-library', protect, async (req, res, next) => {
  try {
    const library = await Library.findOne({ owner_id: req.user._id });
    if (!library) {
      return res.json(null); // No library yet
    }
    res.json(library);
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    // Check if user already has a library
    const existing = await Library.findOne({ owner_id: req.user._id });
    if (existing) {
      res.status(400);
      throw new Error("You already have a library registered.");
    }

    const library = await Library.create({
      ...req.body,
      owner_id: req.user._id
    });
    res.status(201).json(library);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const libraries = await Library.find({});
    res.json(libraries);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const library = await Library.findOne({ _id: req.params.id, owner_id: req.user._id });
    if (!library) {
      res.status(404);
      throw new Error("Library not found or you are not the owner.");
    }
    
    const updated = await Library.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Student marks library as saved
router.post('/save', async (req, res, next) => {
  try {
    const { userId, libraryId } = req.body;
    const User = require('../models/User'); // lazy load
    await User.findByIdAndUpdate(userId, { $addToSet: { savedLibraries: libraryId } });
    res.json({ success: true, message: "Library saved" });
  } catch (error) {
    next(error);
  }
});

// Student removes library from saved
router.post('/unsave', async (req, res, next) => {
  try {
    const { userId, libraryId } = req.body;
    const User = require('../models/User'); 
    await User.findByIdAndUpdate(userId, { $pull: { savedLibraries: libraryId } });
    res.json({ success: true, message: "Library unsaved" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
