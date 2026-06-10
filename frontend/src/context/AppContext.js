import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../services/apiConfig';

const AppContext = createContext({});

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 };
};

export const AppProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null); // 'owner' | 'student'
  const [ownerData, setOwnerData] = useState({ name: '', phone: '', photo: null });
  const [studentData, setStudentData] = useState({ name: '', phone: '', studyGoal: '', photo: null });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = {
    primary: '#1D7151',
    primaryLight: isDarkMode ? '#1A2F25' : '#E8F5E9',
    textDark: isDarkMode ? '#FFFFFF' : '#1A1D1E',
    textGray: isDarkMode ? '#A1A5A7' : '#707375',
    bg: isDarkMode ? '#121212' : '#FDFDFD',
    cardBg: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    border: isDarkMode ? '#333333' : '#EAEAEA',
    danger: '#DC2626',
    dangerLight: isDarkMode ? '#451A1A' : '#FEE2E2',
  };

  const [libraries, setLibraries] = useState([]);
  const [savedLibraryIds, setSavedLibraryIds] = useState([]);
  const [currentLibrary, setCurrentLibrary] = useState(null);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Revenue (local AsyncStorage only) ──
  const REVENUE_KEY = '@libconnect_revenue';
  const [revenueTransactions, setRevenueTransactions] = useState([]);

  // ── On App Start: Load cached data ──
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const [libStored, subStored, ownerStored] = await Promise.all([
        AsyncStorage.getItem('@libconnect_library'),
        AsyncStorage.getItem('@libconnect_subscription'),
        AsyncStorage.getItem('@libconnect_owner'),
      ]);
      if (libStored) setCurrentLibrary(JSON.parse(libStored));
      if (subStored) setSubscriptionPlan(JSON.parse(subStored));
      if (ownerStored) setOwnerData(JSON.parse(ownerStored));
    } catch (e) {
      console.warn('Cache load error:', e.message);
    }
  };

  // ── Revenue ──
  const loadRevenueData = async () => {
    try {
      const stored = await AsyncStorage.getItem(REVENUE_KEY);
      if (stored) {
        setRevenueTransactions(JSON.parse(stored));
      } else {
        setRevenueTransactions([]);
      }
    } catch (e) {
      console.warn('Revenue load error:', e.message);
    }
  };

  const addRevenueEntry = async (entry) => {
    const newEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      date: new Date().toISOString().split('T')[0],
      type: entry.type || 'income',
      category: entry.category || 'student_fee',
      amount: Number(entry.amount) || 0,
      shift: entry.shift || null,
      studentName: entry.studentName || null,
      studentId: entry.studentId || null,
      method: entry.method || 'Cash',
      note: entry.note || '',
      createdAt: new Date().toISOString(),
    };

    setRevenueTransactions(prev => {
      const updated = [newEntry, ...prev];
      AsyncStorage.setItem(REVENUE_KEY, JSON.stringify(updated)).catch(e =>
        console.warn('Revenue save error:', e.message)
      );
      return updated;
    });

    return newEntry;
  };

  // ── MAIN: Fetch Dashboard Data from Backend ──
  const fetchDashboardData = async () => {
    setLoading(true);
    await loadRevenueData();

    try {
      const config = await getAuthHeader();

      // 1. Load owner profile + library from backend
      const meRes = await axios.get(`${API_ENDPOINTS.USERS}/me`, config);
      if (meRes.data?.user) {
        const u = meRes.data.user;
        const ownerInfo = { name: u.name || '', phone: u.phone || '', photo: u.photo || null };
        setOwnerData(ownerInfo);
        await AsyncStorage.setItem('@libconnect_owner', JSON.stringify(ownerInfo));
      }
      if (meRes.data?.library) {
        const lib = meRes.data.library;
        setCurrentLibrary(lib);
        await AsyncStorage.setItem('@libconnect_library', JSON.stringify(lib));

        // 2. Load bookings for this library
        const bookRes = await axios.get(
          `${API_ENDPOINTS.BOOKINGS}/library/${lib._id}`,
          config
        );
        const bookings = bookRes.data?.bookings || bookRes.data || [];
        setCurrentBookings(bookings);
      }

      // 3. Load all libraries (for home screen listing)
      const libsRes = await axios.get(API_ENDPOINTS.LIBRARIES, config);
      const allLibs = libsRes.data || [];
      setLibraries(allLibs);

    } catch (error) {
      console.warn('fetchDashboardData failed (offline?):', error.message);
      // Silently keep cached data — do NOT show dummy data
    } finally {
      setLoading(false);
    }
  };

  // ── Library Registration ──
  const registerLibrary = async (libraryData) => {
    try {
      const { createLibrary } = require('../services/libraryService');
      const lib = await createLibrary(libraryData);
      setCurrentLibrary(lib);
      await AsyncStorage.setItem('@libconnect_library', JSON.stringify(lib));
      return lib;
    } catch (error) {
      console.warn('Backend registration failed, using local mock:', error.message);
      const mockLib = {
        _id: 'local-lib-' + Date.now(),
        name: libraryData.name,
        address: libraryData.address,
        phone: libraryData.phone || '',
        timings: libraryData.timings || '',
        total_seats: libraryData.total_seats,
        totalSeats: libraryData.total_seats,
        available_seats: libraryData.total_seats,
        half_time_fee: libraryData.halfTime?.fee || 0,
        full_time_fee: libraryData.fullTime?.fee || 0,
        halfTime: libraryData.halfTime,
        fullTime: libraryData.fullTime,
        facilities: libraryData.facilities || [],
        photos: libraryData.photos || [],
        coordinates: libraryData.coordinates || null,
      };
      setCurrentLibrary(mockLib);
      await AsyncStorage.setItem('@libconnect_library', JSON.stringify(mockLib));
      return mockLib;
    }
  };

  // ── Library Update ──
  const updateOwnerLibrary = async (updates) => {
    if (currentLibrary?._id) {
      try {
        const { updateLibrary } = require('../services/libraryService');
        const updatedLib = await updateLibrary(currentLibrary._id, updates);
        setCurrentLibrary(updatedLib);
        await AsyncStorage.setItem('@libconnect_library', JSON.stringify(updatedLib));
        return updatedLib;
      } catch (error) {
        console.warn('Backend update failed, applying locally:', error.message);
      }
    }
    // Local fallback
    const u = { ...currentLibrary, ...updates };
    setCurrentLibrary(u);
    await AsyncStorage.setItem('@libconnect_library', JSON.stringify(u));
    return u;
  };

  // ── Profile Save ──
  const saveOwnerProfile = async ({ name, phone }) => {
    try {
      const config = await getAuthHeader();
      await axios.put(`${API_ENDPOINTS.USERS}/profile`, { name }, config);
    } catch (e) {
      console.warn('Profile save failed (offline?):', e.message);
    }
    const updated = { ...ownerData, name, phone };
    setOwnerData(updated);
    await AsyncStorage.setItem('@libconnect_owner', JSON.stringify(updated));
  };

  // ── Student Local Operations ──
  const deleteStudent = async (bookingId) => {
    // Remove from local state first (instant UI)
    setCurrentBookings(prev => prev.filter(b => b._id !== bookingId));
    // Then try backend
    try {
      const config = await getAuthHeader();
      await axios.delete(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, config);
    } catch (e) {
      console.warn('Delete from backend failed (offline?):', e.message);
    }
  };

  const vacateSeat = (seatNumber) => {
    setCurrentBookings(prev =>
      prev.map(b => (parseInt(b.seat, 10) === parseInt(seatNumber, 10) ? { ...b, status: 'Inactive' } : b))
    );
  };

  // ── Libraries (Student) ──
  const toggleSaveLibrary = (id) => {
    setSavedLibraryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updateLibrarySeats = (libraryId, vacant, booked) => {
    setLibraries(prev =>
      prev.map(lib =>
        lib.id === libraryId ? { ...lib, vacantSeats: vacant, bookedSeats: booked } : lib
      )
    );
  };

  const getOwnerLibrary = () => libraries.find(l => l._id === currentLibrary?._id) || libraries[0];

  // ── Logout ──
  const logout = async () => {
    setUserRole(null);
    setCurrentLibrary(null);
    setSubscriptionPlan(null);
    setOwnerData({ name: '', phone: '', photo: null });
    setCurrentBookings([]);
    setLibraries([]);
    try {
      await AsyncStorage.multiRemove([
        'userToken', 'userRole',
        '@libconnect_library', '@libconnect_subscription',
        '@libconnect_revenue', '@libconnect_owner',
      ]);
    } catch (e) {
      console.warn('Logout storage clear error:', e.message);
    }
  };

  return (
    <AppContext.Provider
      value={{
        userRole, setUserRole,
        ownerData, setOwnerData,
        studentData, setStudentData,
        libraries, setLibraries,
        savedLibraryIds, toggleSaveLibrary,
        currentLibrary, setCurrentLibrary,
        currentBookings, setCurrentBookings,
        subscriptionPlan, setSubscriptionPlan,
        fetchDashboardData, loading,
        isDarkMode, setIsDarkMode, theme,
        registerLibrary,
        updateOwnerLibrary,
        saveOwnerProfile,
        deleteStudent,
        vacateSeat,
        updateLibrarySeats,
        getOwnerLibrary,
        logout,
        // Revenue
        revenueTransactions,
        addRevenueEntry,
        loadRevenueData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
