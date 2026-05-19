import { Platform } from 'react-native';

const PRODUCTION_MODE = false;
const PRODUCTION_URL = 'https://cyan-cloths-spend.loca.lt/api'; 

// Development Configuration
const LOCAL_IP = '192.168.29.205'; 
const LOCAL_URL = `http://${LOCAL_IP}:8000/api`;
const WEB_URL = 'http://localhost:8000/api';

// Auto-select URL based on environment
let BASE_URL;
if (PRODUCTION_MODE) {
  BASE_URL = PRODUCTION_URL; // Cloud - works from anywhere!
} else if (Platform.OS === 'web') {
  BASE_URL = WEB_URL;        // Browser localhost
} else {
  BASE_URL = LOCAL_URL;      // Mobile - needs same WiFi
}

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  VERIFY_OTP: `${BASE_URL}/auth/verify-otp`,
  LIBRARIES: `${BASE_URL}/libraries`,
  BOOKINGS: `${BASE_URL}/bookings`,
  PAYMENTS: `${BASE_URL}/payments`,
  USERS: `${BASE_URL}/users`,
  DASHBOARD: `${BASE_URL}/dashboard`,
  UPLOAD: `${BASE_URL}/upload`,
};

export default BASE_URL;
