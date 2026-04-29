const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const keyPath = path.join(__dirname, '../../firebase-admin-key.json');

// Initialize only if the key exists
if (fs.existsSync(keyPath)) {
  const serviceAccount = require(keyPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized successfully.');
} else {
  console.log('⚠️ Firebase Admin Key not found. Real OTP verification will be disabled.');
}

module.exports = admin;
