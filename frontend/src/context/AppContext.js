import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../services/apiConfig';

const AppContext = createContext({});

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 };
};

export const AppProvider = ({ children }) => {
  const [userRole, setUserRole]           = useState(null);
  const [ownerData, setOwnerData]         = useState({ name: '', phone: '', photo: null, upi_id: '' });
  const [studentData, setStudentData]     = useState({ name: '', phone: '', photo: null });
  const [isDarkMode, setIsDarkMode]       = useState(false);
  const [libraries, setLibraries]         = useState([]);
  const [savedLibraryIds, setSavedLibraryIds] = useState([]);
  const [currentLibrary, setCurrentLibrary]   = useState(null);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [revenueTransactions, setRevenueTransactions] = useState([]);

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

  // ── On App Start ──
  useEffect(() => {
    loadCachedData();
  }, []);

  // Load cached data (for instant display before API responds)
  const loadCachedData = async () => {
    try {
      const [libStored, subStored, ownerStored, revenueStored] = await Promise.all([
        AsyncStorage.getItem('@libconnect_library'),
        AsyncStorage.getItem('@libconnect_subscription'),
        AsyncStorage.getItem('@libconnect_owner'),
        AsyncStorage.getItem('@libconnect_revenue'),
      ]);
      if (libStored)     setCurrentLibrary(JSON.parse(libStored));
      if (subStored)     setSubscriptionPlan(JSON.parse(subStored));
      if (ownerStored)   setOwnerData(JSON.parse(ownerStored));
      if (revenueStored) setRevenueTransactions(JSON.parse(revenueStored));
    } catch (e) {
      console.warn('Cache load error:', e.message);
    }
  };

  // ── Revenue (local + backend hybrid) ──
  const REVENUE_KEY = '@libconnect_revenue';

  const loadRevenueData = async () => {
    // Load local first
    try {
      const stored = await AsyncStorage.getItem(REVENUE_KEY);
      if (stored) setRevenueTransactions(JSON.parse(stored));
    } catch (e) {}

    // Then try to sync from backend payments
    try {
      const config = await getAuthHeader();
      const res = await axios.get(`${API_ENDPOINTS.PAYMENTS}/me`, config);
      const backendPayments = res.data?.payments || [];

      if (backendPayments.length > 0) {
        // Convert backend payments to revenueTransaction format
        const converted = backendPayments.map(p => ({
          id: p._id,
          date: new Date(p.paidDate).toISOString().split('T')[0],
          type: p.type || 'income',
          category: p.category || 'student_fee',
          amount: p.amount,
          shift: p.shift || p.booking?.shift || '',
          studentName: p.studentName || p.student?.name || '',
          studentId: p.student?._id || '',
          method: p.method || 'Cash',
          note: p.note || '',
          createdAt: p.createdAt,
        }));
        setRevenueTransactions(converted);
        await AsyncStorage.setItem(REVENUE_KEY, JSON.stringify(converted));
      }
    } catch (e) {
      // Backend offline — keep local data, no crash
      console.warn('Revenue sync from backend failed (offline?):', e.message);
    }
  };

  const addRevenueEntry = async (entry) => {
    let backendId = null;
    if (entry.type === 'expense') {
      try {
        const config = await getAuthHeader();
        const res = await axios.post(`${API_ENDPOINTS.PAYMENTS}/expense`, {
          amount: Number(entry.amount),
          category: entry.category,
          method: entry.method || 'Cash',
          note: entry.note || '',
        }, config);
        if (res.data?.success && res.data?.payment) {
          backendId = res.data.payment._id;
        }
      } catch (e) {
        console.warn('Failed to save expense to backend:', e.message);
        throw e;
      }
    }

    const newEntry = {
      id: backendId || Date.now().toString() + Math.random().toString(36).substr(2, 5),
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
      AsyncStorage.setItem(REVENUE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    return newEntry;
  };

  // ── MAIN: Fetch all owner data from Backend ──
  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const config = await getAuthHeader();

      // 1. Owner profile + library
      const meRes = await axios.get(`${API_ENDPOINTS.USERS}/me`, config);
      if (meRes.data?.user) {
        const u = meRes.data.user;
        const ownerInfo = {
          id:     u.id,
          name:   u.name   || '',
          phone:  u.phone  || '',
          photo:  u.photo  || null,
          upi_id: u.upi_id || '',
        };
        setOwnerData(ownerInfo);
        await AsyncStorage.setItem('@libconnect_owner', JSON.stringify(ownerInfo));

        // Load subscription status dynamically from backend
        if (u.subscription) {
          setSubscriptionPlan(u.subscription);
          await AsyncStorage.setItem('@libconnect_subscription', JSON.stringify(u.subscription));
        }
      }

      if (meRes.data?.library) {
        const lib = meRes.data.library;
        const normalizedLib = { ...lib, id: lib._id || lib.id };
        setCurrentLibrary(normalizedLib);
        await AsyncStorage.setItem('@libconnect_library', JSON.stringify(normalizedLib));

        // 2. Bookings for this library (all statuses)
        const bookRes = await axios.get(
          `${API_ENDPOINTS.BOOKINGS}/library/${lib._id}`,
          config
        );
        const bookings = bookRes.data?.bookings || bookRes.data || [];
        setCurrentBookings(bookings);
      } else {
        // Clear old cached library details for accounts with no registered library
        setCurrentLibrary(null);
        await AsyncStorage.removeItem('@libconnect_library');
        setCurrentBookings([]);
      }

      // 3. All libraries list
      const libsRes = await axios.get(API_ENDPOINTS.LIBRARIES, config);
      const normalizedLibs = (libsRes.data || []).map(l => ({ ...l, id: l._id || l.id }));
      setLibraries(normalizedLibs);

      // 4. Revenue from backend
      await loadRevenueData();

    } catch (error) {
      console.warn('fetchDashboardData failed (offline?):', error.message);
      // Keep cached data — no dummy data injected
    } finally {
      setLoading(false);
    }
  };

  // ── Library Registration (Real backend only) ──
  const registerLibrary = async (libraryData) => {
    const config = await getAuthHeader();
    const { createLibrary } = require('../services/libraryService');
    const lib = await createLibrary(libraryData);
    const normalizedLib = { ...lib, id: lib._id || lib.id };
    setCurrentLibrary(normalizedLib);
    await AsyncStorage.setItem('@libconnect_library', JSON.stringify(normalizedLib));
    return normalizedLib;
    // NOTE: No local fallback — if backend fails, throw error to UI
  };

  // ── Library Update (Real backend only) ──
  const updateOwnerLibrary = async (updates) => {
    if (!currentLibrary?._id) throw new Error('No library found');
    const config = await getAuthHeader();
    const { updateLibrary } = require('../services/libraryService');
    const updatedLib = await updateLibrary(currentLibrary._id, updates);
    const normalizedLib = { ...updatedLib, id: updatedLib._id || updatedLib.id };
    setCurrentLibrary(normalizedLib);
    await AsyncStorage.setItem('@libconnect_library', JSON.stringify(normalizedLib));
    
    // Sync changes into libraries list state array
    setLibraries(prev => prev.map(l => (l._id === normalizedLib._id || l.id === normalizedLib.id) ? normalizedLib : l));
    
    return normalizedLib;
  };

  // ── Profile Save ──
  const saveOwnerProfile = async ({ name, phone, upi_id }) => {
    try {
      const config = await getAuthHeader();
      const updates = {};
      if (name   !== undefined) updates.name   = name;
      if (phone  !== undefined) updates.phone  = phone;
      if (upi_id !== undefined) updates.upi_id = upi_id;
      await axios.put(`${API_ENDPOINTS.USERS}/profile`, updates, config);
    } catch (e) {
      console.warn('Profile save failed (offline?):', e.message);
    }
    const updated = { ...ownerData, name, phone, upi_id };
    setOwnerData(updated);
    await AsyncStorage.setItem('@libconnect_owner', JSON.stringify(updated));
  };

  // ── Delete Student (Real backend) ──
  const deleteStudent = async (bookingId) => {
    // Remove from UI instantly
    setCurrentBookings(prev => prev.filter(b => b._id !== bookingId));
    // Sync to backend
    try {
      const config = await getAuthHeader();
      await axios.delete(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, config);
    } catch (e) {
      console.warn('Delete backend failed:', e.message);
    }
  };

  // ── Accept Join Request ──
  const acceptBooking = async (bookingId) => {
    const config = await getAuthHeader();
    const res = await axios.put(`${API_ENDPOINTS.BOOKINGS}/${bookingId}/accept`, {}, config);
    // Refresh bookings from backend
    await fetchDashboardData();
    return res.data;
  };

  // ── Reject Join Request ──
  const rejectBooking = async (bookingId) => {
    const config = await getAuthHeader();
    await axios.put(`${API_ENDPOINTS.BOOKINGS}/${bookingId}/reject`, {}, config);
    setCurrentBookings(prev => prev.filter(b => b._id !== bookingId));
  };

  // ── Collect Fee / Renew Booking ──
  const collectFee = async (bookingId, amount, method, studentName, shift) => {
    const config = await getAuthHeader();
    const res = await axios.post(API_ENDPOINTS.PAYMENTS, {
      bookingId,
      amount: Number(amount),
      method: method || 'Cash',
      studentName: studentName || '',
      shift: shift || '',
    }, config);

    // Add to local revenue tracker too
    await addRevenueEntry({
      type: 'income',
      category: 'student_fee',
      amount: Number(amount),
      method: method || 'Cash',
      studentName: studentName || '',
      shift: shift || '',
    });

    // Refresh from backend to get updated endDate
    await fetchDashboardData();
    return res.data;
  };

  const vacateSeat = (seatNumber) => {
    setCurrentBookings(prev =>
      prev.map(b => (parseInt(b.seat, 10) === parseInt(seatNumber, 10) ? { ...b, status: 'Inactive' } : b))
    );
  };

  const toggleSaveLibrary = (id) => {
    setSavedLibraryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updateLibrarySeats = (libraryId, vacant, booked) => {
    setLibraries(prev =>
      prev.map(lib =>
        lib._id === libraryId ? { ...lib, vacantSeats: vacant, bookedSeats: booked } : lib
      )
    );
  };

  const getOwnerLibrary = () => libraries.find(l => l._id === currentLibrary?._id) || null;

  // ── Update Subscription ──
  const updateOwnerSubscription = async ({ name, daysLeft, type }) => {
    try {
      const config = await getAuthHeader();
      const res = await axios.put(`${API_ENDPOINTS.USERS}/subscription`, { name, daysLeft, type }, config);
      if (res.data?.success && res.data?.subscription) {
        setSubscriptionPlan(res.data.subscription);
        await AsyncStorage.setItem('@libconnect_subscription', JSON.stringify(res.data.subscription));
      }
    } catch (e) {
      console.warn('Subscription update failed (offline?):', e.message);
      throw e;
    }
  };

  // ── Logout ──
  const logout = async () => {
    setUserRole(null);
    setCurrentLibrary(null);
    setSubscriptionPlan(null);
    setOwnerData({ name: '', phone: '', photo: null, upi_id: '' });
    setCurrentBookings([]);
    setLibraries([]);
    setRevenueTransactions([]);
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
        updateOwnerSubscription,
        fetchDashboardData, loading,
        isDarkMode, setIsDarkMode, theme,
        registerLibrary,
        updateOwnerLibrary,
        saveOwnerProfile,
        deleteStudent,
        acceptBooking,
        rejectBooking,
        collectFee,
        vacateSeat,
        updateLibrarySeats,
        getOwnerLibrary,
        logout,
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
