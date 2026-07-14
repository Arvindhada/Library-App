const express = require('express');
const User = require('../models/User');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/users/me
// @desc    Get current logged-in user's profile + their library if owner
// @access  Private
// ─────────────────────────────────────────────────────────────────
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
        id:        user._id,
        name:      user.name      || '',
        phone:     user.phone     || '',
        role:      user.role,
        photo:     user.photo     || null,
        upi_id:    user.upi_id   || '',
        subscription: user.subscription || { name: 'Basic – Free Trial', daysLeft: 14, type: 'free' },
        createdAt: user.createdAt,
      },
      library: myLibrary
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/users/subscription
// @desc    Update owner subscription details
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.put('/subscription', protect, async (req, res, next) => {
  try {
    const { name, daysLeft, type } = req.body;
    if (!name) { res.status(400); throw new Error('Plan name is required'); }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { subscription: { name, daysLeft: Number(daysLeft) || 30, type: type || 'monthly' } },
      { new: true }
    );
    res.json({ success: true, subscription: user.subscription, message: 'Subscription updated successfully' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/users/profile
// @desc    Update user name, phone, photo, UPI ID
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone, photo, upi_id, studyGoal } = req.body;
    const updates = {};
    if (name   !== undefined) updates.name   = name.trim();
    if (phone  !== undefined) updates.phone  = phone.trim();
    if (photo  !== undefined) updates.photo  = photo;
    if (upi_id !== undefined) updates.upi_id = upi_id.trim();
    if (studyGoal !== undefined) updates.studyGoal = studyGoal.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-__v');
    res.json({ success: true, user, message: 'Profile updated successfully' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/users/upi
// @desc    Update only UPI ID for owner
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.put('/upi', protect, async (req, res, next) => {
  try {
    const { upi_id } = req.body;
    if (!upi_id) { res.status(400); throw new Error('UPI ID is required'); }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { upi_id: upi_id.trim() },
      { new: true }
    ).select('name phone upi_id');

    res.json({ success: true, user, message: 'UPI ID updated successfully' });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────
// @route   PUT /api/users/link-library
// @desc    Link owner to their library
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.put('/link-library', protect, async (req, res, next) => {
  try {
    const { libraryId } = req.body;
    await User.findByIdAndUpdate(req.user._id, { role: 'owner' });
    const library = await Library.findByIdAndUpdate(libraryId, { owner_id: req.user._id }, { new: true });
    if (!library) { res.status(404); throw new Error('Library not found'); }
    res.json({ success: true, message: 'Library linked to your account', library });
  } catch (error) { next(error); }
});

// Toggle saving library for student
router.put('/save-library/:libraryId', protect, async (req, res, next) => {
  try {
    const { libraryId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) { res.status(404); throw new Error('User not found'); }

    const index = user.savedLibraries.indexOf(libraryId);
    if (index > -1) {
      user.savedLibraries.splice(index, 1);
    } else {
      user.savedLibraries.push(libraryId);
    }
    await user.save();
    res.json({ success: true, savedLibraries: user.savedLibraries, message: 'Saved libraries updated' });
  } catch (error) { next(error); }
});

module.exports = router;
