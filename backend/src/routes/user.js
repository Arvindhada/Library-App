const express = require('express');
const User = require('../models/User');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current logged-in user's profile + their library if owner
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');

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
        upi_id: user.upi_id,
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
    if (upi_id !== undefined) updates.upi_id = upi_id;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-__v');
    res.json({ success: true, user, message: 'Profile updated successfully' });
  } catch (error) { next(error); }
});

// @route   PUT /api/users/link-library
// @desc    Link owner to their library (called when owner registers for first time)
// @access  Private
router.put('/link-library', protect, async (req, res, next) => {
  try {
    const { libraryId } = req.body;
    
    // Update user role to owner
    await User.findByIdAndUpdate(req.user._id, { role: 'owner' });
    
    // Link this user as owner of the library
    const library = await Library.findByIdAndUpdate(libraryId, { owner_id: req.user._id }, { new: true });
    if (!library) { res.status(404); throw new Error('Library not found'); }

    res.json({ success: true, message: 'Library linked to your account', library });
  } catch (error) { next(error); }
});

module.exports = router;
