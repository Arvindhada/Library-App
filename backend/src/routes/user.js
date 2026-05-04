const express = require('express');
const Student = require('../models/Student');
const Owner = require('../models/Owner');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const AppError = require('../utils/AppError');
const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current logged-in user's profile + their library if owner
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = req.user;

    let myLibrary = null;
    if (user.role === 'owner') {
      myLibrary = await Library.findOne({ owner_id: user._id });
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        photo: user.photo,
        upi_id: user.upi_id, // Might be undefined for students, which is fine
        createdAt: user.createdAt,
      },
      library: myLibrary 
    });
  } catch (error) { next(error); }
});

// @route   PUT /api/users/profile
// @desc    Update user name, photo, UPI ID
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, photo, upi_id } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (photo !== undefined) updates.photo = photo;
    
    // Only owners have upi_id
    if (upi_id !== undefined && req.user.role === 'owner') updates.upi_id = upi_id;

    let updatedUser;
    if (req.user.role === 'owner') {
      updatedUser = await Owner.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-__v');
    } else {
      updatedUser = await Student.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-__v');
    }
    
    res.json({ success: true, user: updatedUser, message: 'Profile updated successfully' });
  } catch (error) { next(error); }
});

// @route   PUT /api/users/link-library
// @desc    Link owner to their library
// @access  Private
router.put('/link-library', protect, async (req, res, next) => {
  try {
    const { libraryId } = req.body;
    
    if (req.user.role !== 'owner') {
      return next(new AppError('Only owners can link libraries.', 403));
    }
    
    // Link this user as owner of the library
    const library = await Library.findByIdAndUpdate(libraryId, { owner_id: req.user._id }, { new: true });
    if (!library) { return next(new AppError('Library not found', 404)); }

    res.json({ success: true, message: 'Library linked to your account', library });
  } catch (error) { next(error); }
});

module.exports = router;
