import axios from 'axios';
import { API_ENDPOINTS } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getMyLibrary = async () => {
  try {
    const config = await getAuthHeader();
    const response = await axios.get(`${API_ENDPOINTS.LIBRARIES}/my-library`, config);
    return response.data;
  } catch (error) {
    console.error('Fetch My Library Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getLibraryBookings = async (libraryId) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.get(`${API_ENDPOINTS.BOOKINGS}/library/${libraryId}`, config);
    return response.data;
  } catch (error) {
    console.error('Fetch Bookings Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const createLibrary = async (libraryData) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.post(API_ENDPOINTS.LIBRARIES, libraryData, config);
    return response.data;
  } catch (error) {
    console.error('Create Library Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateLibrary = async (libraryId, libraryData) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.put(`${API_ENDPOINTS.LIBRARIES}/${libraryId}`, libraryData, config);
    return response.data;
  } catch (error) {
    console.error('Update Library Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
