const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Phone Number: Used for OTP based login (Owner/Student)
  phone: { type: String, unique: true, sparse: true },
  
  // Email & GoogleID: Used for "Continue with Google" flow
  email: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  
  // Role: Can be 'student' or 'owner'. Default is 'student'.
  role: { type: String, enum: ['student', 'owner'], default: 'student' },
  
  // Profile Info
  name: { type: String, default: '' },
  photo: { type: String, default: null }, // URL to profile picture
  upi_id: { type: String, default: '' }, // Payment ID for Owners
  
  // Student specific: List of libraries they have marked as 'Saved'
  savedLibraries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Library' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
