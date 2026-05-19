import axios from 'axios';
import { API_ENDPOINTS } from './apiConfig';

export const loginWithPhone = async (phone) => {
  try {
    const response = await axios.post(API_ENDPOINTS.LOGIN, { phone });
    return response.data;
  } catch (error) {
    console.error('Login Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const loginWithGoogle = async (googleData) => {
  try {
    // googleData should contain { email, name, googleId }
    // The backend endpoint is /api/auth/google
    const response = await axios.post(API_ENDPOINTS.LOGIN.replace('/login', '/google'), googleData);
    return response.data;
  } catch (error) {
    console.error('Google Login Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const verifyOTP = async (phone, otp, role = 'student') => {
  try {
    const response = await axios.post(API_ENDPOINTS.VERIFY_OTP, { phone, otp, role });
    return response.data;
  } catch (error) {
    const errData = error.response?.data;
    console.error('OTP Verification Error:', errData || error.message);
    // Throw a proper Error so .message works in catch blocks
    const message = errData?.message || errData?.error || error.message || 'OTP verification failed';
    throw new Error(message);
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  } catch (error) {
    console.error('Registration Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
