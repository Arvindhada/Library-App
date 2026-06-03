import axios from 'axios';
import { API_ENDPOINTS } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const createBooking = async (bookingData) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.post(API_ENDPOINTS.BOOKINGS, bookingData, config);
    return response.data;
  } catch (error) {
    console.error('Create Booking Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getBookingsByLibrary = async (libraryId) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.get(`${API_ENDPOINTS.BOOKINGS}/library/${libraryId}`, config);
    return response.data;
  } catch (error) {
    console.error('Fetch Bookings Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.put(`${API_ENDPOINTS.BOOKINGS}/${bookingId}/status`, { status }, config);
    return response.data;
  } catch (error) {
    console.error('Update Booking Status Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const ownerAddStudent = async (studentData) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.post(`${API_ENDPOINTS.BOOKINGS}/owner/add-student`, studentData, config);
    return response.data;
  } catch (error) {
    console.error('Owner Add Student Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const deleteBooking = async (bookingId) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.delete(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, config);
    return response.data;
  } catch (error) {
    console.error('Delete Booking Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
