import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../services/apiConfig';

export const useBookings = (getAuthHeader) => {
  const [currentBookings, setCurrentBookings] = useState([]);
  const [savedLibraryIds, setSavedLibraryIds] = useState([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [revenueTransactions, setRevenueTransactions] = useState([]);

  const REVENUE_KEY = '@libconnect_revenue';

  const fetchStudentBookings = async () => {
    try {
      const config = await getAuthHeader();
      const res = await axios.get(API_ENDPOINTS.BOOKINGS + '/me', config);
      if (res.data?.success) {
        setCurrentBookings(res.data.bookings || []);
        return res.data.bookings;
      }
    } catch (e) {
      console.warn('Failed to fetch student bookings:', e.message);
    }
    return [];
  };

  const loadRevenueData = async () => {
    try {
      const stored = await AsyncStorage.getItem(REVENUE_KEY);
      if (stored) setRevenueTransactions(JSON.parse(stored));
    } catch (e) {}

    try {
      const config = await getAuthHeader();
      const res = await axios.get(`${API_ENDPOINTS.PAYMENTS}/me`, config);
      const backendPayments = res.data?.payments || [];

      if (backendPayments.length > 0) {
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
      } else {
        // ✅ CRITICAL: If new account has 0 payments, clear old cached payments!
        setRevenueTransactions([]);
        await AsyncStorage.removeItem(REVENUE_KEY);
      }
    } catch (e) {
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

    setCurrentBookings(prevBookings => {
      setRevenueTransactions(prev => {
        const updated = [newEntry, ...prev];
        AsyncStorage.setItem(REVENUE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      return prevBookings;
    });

    return newEntry;
  };

  const deleteStudent = async (bookingId) => {
    setCurrentBookings(prev => prev.filter(b => b._id !== bookingId));
    try {
      const config = await getAuthHeader();
      await axios.delete(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, config);
    } catch (e) {
      console.warn('Delete backend failed:', e.message);
    }
  };

  const acceptBooking = async (bookingId, onComplete) => {
    const config = await getAuthHeader();
    const res = await axios.put(`${API_ENDPOINTS.BOOKINGS}/${bookingId}/accept`, {}, config);
    if (onComplete) await onComplete();
    return res.data;
  };

  const rejectBooking = async (bookingId) => {
    const config = await getAuthHeader();
    await axios.put(`${API_ENDPOINTS.BOOKINGS}/${bookingId}/reject`, {}, config);
    setCurrentBookings(prev => prev.filter(b => b._id !== bookingId));
  };

  const collectFee = async (bookingId, amount, method, studentName, shift, onComplete) => {
    const config = await getAuthHeader();
    const res = await axios.post(API_ENDPOINTS.PAYMENTS, {
      bookingId,
      amount: Number(amount),
      method: method || 'Cash',
      studentName: studentName || '',
      shift: shift || '',
    }, config);

    await addRevenueEntry({
      type: 'income',
      category: 'student_fee',
      amount: Number(amount),
      method: method || 'Cash',
      studentName: studentName || '',
      shift: shift || '',
    });

    if (onComplete) await onComplete();
    return res.data;
  };

  const vacateSeat = async (seatNumber, bookingId, onComplete) => {
    setCurrentBookings(prev =>
      prev.map(b => (parseInt(b.seat, 10) === parseInt(seatNumber, 10) ? { ...b, status: 'Inactive' } : b))
    );

    if (bookingId) {
      try {
        const config = await getAuthHeader();
        await axios.delete(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, config);
        if (onComplete) await onComplete();
      } catch (e) {
        console.warn('Vacate seat backend sync failed:', e.message);
        if (onComplete) await onComplete();
      }
    }
  };

  const toggleSaveLibrary = async (id) => {
    setSavedLibraryIds(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      AsyncStorage.setItem('@libconnect_saved_libraries', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    try {
      const config = await getAuthHeader();
      const res = await axios.put(`${API_ENDPOINTS.USERS}/save-library/${id}`, {}, config);
      if (res.data?.success && res.data?.savedLibraries) {
        setSavedLibraryIds(res.data.savedLibraries);
        await AsyncStorage.setItem('@libconnect_saved_libraries', JSON.stringify(res.data.savedLibraries));
      }
    } catch (e) {
      console.warn('Sync toggleSaveLibrary with backend failed:', e.message);
    }
  };

  const bookLibrarySpace = async (libraryId, shift, seat) => {
    try {
      const config = await getAuthHeader();
      const res = await axios.post(API_ENDPOINTS.BOOKINGS, {
        libraryId,
        shift: shift || 'Full Time',
        seat: seat ? String(seat) : undefined,
      }, config);
      return res.data;
    } catch (e) {
      console.warn('Booking request failed:', e.message);
      throw e;
    }
  };

  const getPublicSeats = async (libraryId) => {
    try {
      const res = await axios.get(`${API_ENDPOINTS.BOOKINGS}/public-seats/${libraryId}`);
      return res.data?.occupiedSeats || [];
    } catch (e) {
      console.warn('Failed to fetch public seats:', e.message);
      return [];
    }
  };

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

  return {
    currentBookings,
    setCurrentBookings,
    savedLibraryIds,
    setSavedLibraryIds,
    subscriptionPlan,
    setSubscriptionPlan,
    revenueTransactions,
    setRevenueTransactions,
    fetchStudentBookings,
    loadRevenueData,
    addRevenueEntry,
    deleteStudent,
    acceptBooking,
    rejectBooking,
    collectFee,
    vacateSeat,
    toggleSaveLibrary,
    bookLibrarySpace,
    getPublicSeats,
    updateOwnerSubscription,
  };
};
