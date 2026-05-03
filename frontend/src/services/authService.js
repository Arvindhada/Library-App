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

export const verifyOTP = async (phone, otp) => {
  try {
    const response = await axios.post(API_ENDPOINTS.VERIFY_OTP, { phone, otp });
    return response.data;
  } catch (error) {
    console.error('OTP Verification Error:', error.response?.data || error.message);
    throw error.response?.data || error;
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
