const express = require('express');
const Student = require('../models/Student');
const Owner = require('../models/Owner');
const Library = require('../models/Library');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { updateProfileSchema } = require('../validations/authSchemas');
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
        upi_id: user.upi_id,
        city: user.city,
        studyGoal: user.studyGoal,
        createdAt: user.createdAt,
      },
      library: myLibrary 
    });
  } catch (error) { next(error); }
});

// @route   PUT /api/users/profile
// @desc    Update user name, photo, UPI ID
// @access  Private
router.put('/profile', protect, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { name, phone, photo, upi_id, city, studyGoal } = req.body;
    
    
    if (phone) {
      const phoneStr = String(phone);
      const normalizedPhone = phoneStr.replace(/\D/g, '').slice(-10);
      let existingUser;
      if (req.user.role === 'owner') {
        existingUser = await Owner.findOne({ phone: normalizedPhone });
      } else {
        existingUser = await Student.findOne({ phone: normalizedPhone });
      }
      
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return next(new AppError('This phone number is already registered to another account.', 400));
      }
      req.body.phone = normalizedPhone;
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (req.body.phone) updates.phone = req.body.phone;
    if (photo !== undefined) updates.photo = photo;
    if (city) updates.city = city.trim();
    if (studyGoal !== undefined) updates.studyGoal = studyGoal.trim();
    
    if (req.user.role === 'student' && name && req.user.isOnboarded === false) {
      updates.isOnboarded = true;
    } else if (req.user.role === 'student' && name && req.user.isOnboarded === undefined) {
      // In case the field didn't exist before in the document
      updates.isOnboarded = true;
    }
    
    // Only owners have upi_id
    if (upi_id !== undefined && req.user.role === 'owner') updates.upi_id = upi_id;



    let updatedUser;
    if (req.user.role === 'owner') {
      updatedUser = await Owner.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-__v');
    } else {
      updatedUser = await Student.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-__v');
    }
    
    res.json({ success: true, user: updatedUser, message: 'Profile updated successfully' });
  } catch (error) { 
    next(error); 
  }
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
