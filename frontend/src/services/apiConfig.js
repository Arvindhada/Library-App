import { Platform } from 'react-native';

// API Configuration
// ─────────────────────────────────────────────
// PUBLIC TUNNEL (localhost.run) - Works on ANY network (WiFi + LTE both)
// NOTE: Agar tunnel band ho jaye to naya URL update karna hoga
// ─────────────────────────────────────────────

// 🌐 Permanent Cloud URL (Render.com)
const CLOUD_URL = 'https://library-app-9w88.onrender.com/api';

// 📡 Local WiFi URL (jab phone aur laptop same WiFi pe ho)
const LOCAL_URL  = 'http://192.168.29.89:8000/api';

// ✅ Abhi PERMANENT CLOUD URL use ho rahi hai
const BASE_URL = CLOUD_URL;

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
