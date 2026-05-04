const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');
const AppError = require('../utils/AppError');
const router = express.Router();

// Multer storage setup (Memory storage is best for small images and direct upload to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed!', 400), false);
    }
  },
});

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please provide an image file', 400));
    }

    // Upload to Cloudinary using buffer stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'librarywala/photos',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          return next(new AppError('Cloudinary upload failed: ' + error.message, 500));
        }
        res.json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
