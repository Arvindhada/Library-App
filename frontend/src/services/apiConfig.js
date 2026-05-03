// API Configuration
// For Local Development: 
// Use your computer's IP address if testing on a real device, 
// or 'http://localhost:8000/api' for emulator.

// For Android Emulator, use '10.0.2.2' instead of 'localhost'
// For iOS Simulator or Web, 'localhost' is fine.
const BASE_URL = 'http://10.0.2.2:8000/api'; 

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  VERIFY_OTP: `${BASE_URL}/auth/verify-otp`,
  LIBRARIES: `${BASE_URL}/libraries`,
  BOOKINGS: `${BASE_URL}/bookings`,
  PAYMENTS: `${BASE_URL}/payments`,
  USERS: `${BASE_URL}/users`,
};

export default BASE_URL;
