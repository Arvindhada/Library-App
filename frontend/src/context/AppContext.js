import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../services/apiConfig';

const AppContext = createContext({});

export const AppProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = {
    primary: '#1D7151',
    primaryLight: isDarkMode ? '#1A2F25' : '#E8F5E9',
    textDark: isDarkMode ? '#FFFFFF' : '#1A1D1E',
    textGray: isDarkMode ? '#A1A5A7' : '#707375',
    bg: isDarkMode ? '#121212' : '#FDFDFD',
    cardBg: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    border: isDarkMode ? '#333333' : '#EAEAEA',
    badgeBg: isDarkMode ? '#2A2A2A' : '#F4F4F4',
    danger: '#DC2626',
    dangerLight: isDarkMode ? '#451A1A' : '#FEE2E2',
  };

  const [currentLibrary, setCurrentLibrary] = useState(null);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);   // { totalSeats, occupiedSeats, freeSeats, pendingRequests, duePayments, ... }
  const [revenue, setRevenue] = useState({ today: 0, thisMonth: 0, total: 0 });
  const [seatMap, setSeatMap] = useState({});                   // { "1": { name, phone, shift, endDate, ... } }
  const [loading, setLoading] = useState(false);

  // Initialization
  React.useEffect(() => {
    const initApp = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');
        if (token && role) {
          setUserRole(role);
        }
      } catch (e) {
        console.warn('Init App failed:', e);
      }
    };
    initApp();
  }, []);

  // Trigger data fetching when role is set/loaded
  React.useEffect(() => {
    if (userRole === 'owner') fetchDashboardData();
    else if (userRole === 'student') fetchStudentBookings();
  }, [userRole]);

  // Public libraries list (for Student home & Explore)
  const [libraries, setLibraries] = useState([]);

  // Saved libraries for students
  const [savedLibraryIds, setSavedLibraryIds] = useState([]);
  const toggleSaveLibrary = (id) => {
    setSavedLibraryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Owner Dashboard Data
  // Fetches everything from the new dedicated /api/dashboard/stats endpoint
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { setLoading(false); return; }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Single call — returns library, stats, revenue, seatMap, bookings
      const res = await axios.get(`${API_ENDPOINTS.DASHBOARD}/stats`, config);
      const data = res.data;

      if (!data.hasLibrary) {
        // Owner has no library yet — clear everything
        setCurrentLibrary(null);
        setCurrentBookings([]);
        setDashboardStats(null);
        setRevenue({ today: 0, thisMonth: 0, total: 0 });
        setSeatMap({});
        setLoading(false);
        return;
      }

      setCurrentLibrary(data.library);
      setDashboardStats(data.stats);
      setRevenue(data.revenue || { today: 0, thisMonth: 0, total: 0 });
      setSeatMap(data.seatMap || {});

      // currentBookings = all active bookings (used by seat map in dashboard)
      setCurrentBookings(data.activeBookings || []);
      setPendingBookings(data.pendingBookings || []);

      // Also fetch owner profile separately
      const profileRes = await axios.get(`${API_ENDPOINTS.USERS}/me`, config);
      if (profileRes.data?.user) setOwnerData(profileRes.data.user);

    } catch (error) {
      console.warn('Dashboard fetch failed:', error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Student Bookings
  const fetchStudentBookings = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Fetch Bookings
      try {
        const res = await axios.get(`${API_ENDPOINTS.BOOKINGS}/me`, config);
        if (res.data?.success) setCurrentBookings(res.data.bookings || []);
      } catch (err) { 
        console.warn('Bookings fetch failed:', err.message);
        setCurrentBookings([]); // Clear on failure to avoid stale data
      }
 
      // 2. Fetch Profile Info
      try {
        const profileRes = await axios.get(`${API_ENDPOINTS.USERS}/me`, config);
        if (profileRes.data?.user) setStudentData(profileRes.data.user);
      } catch (err) { 
        console.warn('Profile fetch failed:', err.message);
      }

    } catch (error) {
      console.warn('Student fetch failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestBooking = async (bookingData) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('You must be logged in to book.');

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(API_ENDPOINTS.BOOKINGS, bookingData, config);
      
      if (res.data?.success) {
        await fetchStudentBookings();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: 'Could not send booking request.' };
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Booking failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Public Libraries
  const fetchLibraries = async (searchQuery = '') => {
    try {
      const url = searchQuery
        ? `${API_ENDPOINTS.LIBRARIES}?search=${encodeURIComponent(searchQuery)}`
        : API_ENDPOINTS.LIBRARIES;
      const res = await axios.get(url);
      const libs = res.data?.libraries || [];
      // Normalize _id to id for compatibility
      setLibraries(libs.map(l => ({ ...l, id: l._id, vacantSeats: l.available_seats })));
    } catch (error) {
      console.warn('Libraries fetch failed:', error.message);
    }
  };

  const logout = async (router) => {
    try {
      // 1. Clear all authentication data from storage
      await AsyncStorage.multiRemove(['userToken', 'userRole']);
      
      setUserRole(null);
      setOwnerData(null);
      setStudentData(null);
      setCurrentLibrary(null);
      setCurrentBookings([]);
      setPendingBookings([]);
      setDashboardStats(null);
      setRevenue({ today: 0, thisMonth: 0, total: 0 });
      setSeatMap({});
      setSavedLibraryIds([]);
      
      // 3. Perform navigation to the splash screen
      if (router) {
        // Small delay ensures state updates are being processed before navigation
        setTimeout(() => {
          router.replace('/');
        }, 100);
      } else {
        console.warn('[Logout] Router not provided, navigation skipped');
      }
    } catch (e) {
      console.error('[Logout] Critical error during logout:', e);
      // Even if clearing fails, try to navigate to prevent the user from being stuck
      if (router) router.replace('/');
    }
  };

  return (
    <AppContext.Provider
      value={{
        userRole, setUserRole,
        ownerData, setOwnerData,
        studentData, setStudentData,
        savedLibraryIds, toggleSaveLibrary,
        libraries, setLibraries, fetchLibraries,
        currentLibrary, setCurrentLibrary,
        currentBookings, setCurrentBookings,
        pendingBookings, setPendingBookings,
        dashboardStats,    // { totalSeats, occupiedSeats, freeSeats, pendingRequests, duePayments, expiringSoon }
        revenue,           // { today, thisMonth, total }
        seatMap,           // { "1": { name, phone, shift, endDate, paymentStatus }, "5": {...} }
        fetchDashboardData,
        fetchStudentBookings,
        requestBooking,
        logout,
        loading,
        isDarkMode, setIsDarkMode, theme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;

