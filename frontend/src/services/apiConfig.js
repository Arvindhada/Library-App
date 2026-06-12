// API Configuration
// ─────────────────────────────────────────────
// For Android Emulator:     BASE_URL = 'http://10.0.2.2:8000/api'
// For iOS Simulator:        BASE_URL = 'http://localhost:8000/api'
// For Real Physical Device: Use your computer's local WiFi IP below
// ─────────────────────────────────────────────

const BASE_URL = 'http://192.168.29.77:8000/api'; // Your WiFi IP — real device

export const API_ENDPOINTS = {
  LOGIN:      `${BASE_URL}/auth/login`,
  REGISTER:   `${BASE_URL}/auth/register`,
  VERIFY_OTP: `${BASE_URL}/auth/verify-otp`,
  LIBRARIES:  `${BASE_URL}/libraries`,
  BOOKINGS:   `${BASE_URL}/bookings`,
  PAYMENTS:   `${BASE_URL}/payments`,
  USERS:      `${BASE_URL}/users`,
};

export default BASE_URL;
