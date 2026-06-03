import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dummyLibraries } from '../constants/dummyData';

const AppContext = createContext({});

export const AppProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null); // 'owner' | 'student'
  const [ownerData, setOwnerData] = useState({
    name: 'Rajesh Kumar',
    phone: '9988378077',
    photo: null,
    libraryId: '1',
  });
  const [studentData, setStudentData] = useState({
    name: '',
    phone: '',
    studyGoal: '',
    photo: null,
  });

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

  const [libraries, setLibraries] = useState(dummyLibraries);
  const [savedLibraryIds, setSavedLibraryIds] = useState([]);
  const [seatStates, setSeatStates] = useState({}); // { libraryId: [true, false, ...] }
  const [students, setStudents] = useState([
    { id: '1', name: 'Aman Sharma', phone: '9876543210', seat: '12', plan: 'Full Time', expiry: '2026-04-17', status: 'Expiring' },
    { id: '2', name: 'Priya Verma', phone: '9123456789', seat: '05', plan: 'Half Time', expiry: '2026-04-15', status: 'Active' },
  ]);
  const [payments, setPayments] = useState([
    { id: '1', studentId: '1', amount: 800, date: '2026-04-15', method: 'UPI' },
    { id: '2', studentId: '2', amount: 400, date: '2026-04-16', method: 'Cash' },
    { id: '3', studentId: '1', amount: 800, date: '2026-03-10', method: 'UPI' },
    { id: '4', studentId: '2', amount: 400, date: '2026-03-12', method: 'Cash' },
    { id: '5', studentId: '1', amount: 800, date: '2026-02-08', method: 'UPI' },
    { id: '6', studentId: '2', amount: 400, date: '2026-01-20', method: 'Card' },
  ]);
  const [activities, setActivities] = useState([
    { id: '1', type: 'join', text: 'Aman Sharma joined the library', time: '2h ago' },
    { id: '2', type: 'payment', text: 'Priya Verma paid ₹400', time: '5h ago' },
  ]);

  const [currentLibrary, setCurrentLibrary] = useState(null);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Revenue Transactions (persistent via AsyncStorage) ──
  const REVENUE_KEY = '@libconnect_revenue';
  const [revenueTransactions, setRevenueTransactions] = useState([]);

  // Load revenue data from AsyncStorage
  const loadRevenueData = async () => {
    try {
      const stored = await AsyncStorage.getItem(REVENUE_KEY);
      if (stored) {
        setRevenueTransactions(JSON.parse(stored));
      } else {
        // Seed initial dummy data so the owner can see the design
        const todayStr = new Date().toISOString().split('T')[0];
        const dummyData = [
          { id: 't1', date: todayStr, type: 'income', category: 'student_fee', amount: 1200, shift: 'Full Time', studentName: 'Aman Sharma', method: 'UPI', createdAt: new Date().toISOString() },
          { id: 't2', date: todayStr, type: 'expense', category: 'electricity', amount: 2400, shift: null, studentName: null, method: 'Cash', note: 'May Electricity Bill', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: 't3', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], type: 'income', category: 'due_collection', amount: 800, shift: 'Morning', studentName: 'Priya Verma', method: 'Cash', createdAt: new Date(Date.now() - 86400000).toISOString() },
        ];
        setRevenueTransactions(dummyData);
        AsyncStorage.setItem(REVENUE_KEY, JSON.stringify(dummyData));
      }
    } catch (e) {
      console.warn('Could not load revenue data:', e.message);
    }
  };

  // Add a new revenue entry (income or expense) and persist it
  // entry: { type, category, amount, shift, studentName, studentId, method, note }
  const addRevenueEntry = async (entry) => {
    const newEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      date: new Date().toISOString().split('T')[0], // 'YYYY-MM-DD'
      type: entry.type || 'income',             // 'income' | 'expense'
      category: entry.category || 'student_fee',// 'student_fee'|'due_collection'|'rent'|'electricity'|'wifi'|'other'
      amount: Number(entry.amount) || 0,
      shift: entry.shift || null,               // 'Morning'|'Evening'|'Full Time'|'Half Time'
      studentName: entry.studentName || null,
      studentId: entry.studentId || null,
      method: entry.method || 'Cash',           // 'UPI'|'Cash'|'Online'
      note: entry.note || '',
      createdAt: new Date().toISOString(),
    };

    setRevenueTransactions(prev => {
      const updated = [newEntry, ...prev];
      // Persist to AsyncStorage immediately
      AsyncStorage.setItem(REVENUE_KEY, JSON.stringify(updated)).catch(e =>
        console.warn('Revenue save error:', e.message)
      );
      return updated;
    });

    return newEntry;
  };

  // Fetch Dashboard Data from Backend
  const fetchDashboardData = async () => {
    setLoading(true);
    // Always reload revenue data on dashboard refresh
    await loadRevenueData();
    try {
      // TEMPORARY: Bypassing actual backend call for UI testing on physical phone
      setTimeout(() => {
        setCurrentLibrary({
          _id: 'dummy-lib-1',
          name: 'Premium Study Library',
          totalSeats: 100,
          halfTime: { fee: 600 },
          fullTime: { fee: 1000 }
        });
        
        // Mock current bookings
        setCurrentBookings([
          { _id: 'b1', seat: '12', shift: 'Full Time', status: 'Active', endDate: '2026-06-10T00:00:00Z', student: { name: 'Aman Sharma', phone: '9876543210' } },
          { _id: 'b2', seat: '05', shift: 'Half Time', status: 'Active', endDate: '2024-01-01T00:00:00Z', student: { name: 'Priya Verma', phone: '9123456789' } },
          { _id: 'b3', seat: '18', shift: 'Full Time', status: 'Active', endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), student: { name: 'Rahul Joshi', phone: '9988776655' } },
        ]);
        setLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('AppContext Fetch Error:', error);
      const { Alert } = require('react-native');
      Alert.alert('Dashboard Error', 'Could not connect to backend.');
      setLoading(false);
    }
  };

  // Toggle saved library
  const toggleSaveLibrary = (id) => {
    setSavedLibraryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Update library seats
  const updateLibrarySeats = (libraryId, vacant, booked) => {
    setLibraries((prev) =>
      prev.map((lib) =>
        lib.id === libraryId ? { ...lib, vacantSeats: vacant, bookedSeats: booked } : lib
      )
    );
  };

  // Add Payment
  const addPayment = (payment) => {
    setPayments((prev) => [...prev, { ...payment, id: Date.now().toString() }]);
    const student = students.find(s => s.id === payment.studentId);
    setActivities((prev) => [
      { id: Date.now().toString(), type: 'payment', text: `${student?.name || 'Someone'} paid ₹${payment.amount}`, time: 'Just now' },
      ...prev
    ]);
  };

  // Add/Update student
  const saveStudent = (student) => {
    setStudents((prev) => {
      const exists = prev.find((s) => s.id === student.id);
      if (exists) return prev.map((s) => (s.id === student.id ? student : s));
      setActivities((pa) => [
        { id: Date.now().toString(), type: 'join', text: `${student.name} joined the library`, time: 'Just now' },
        ...pa
      ]);
      return [...prev, { ...student, id: Date.now().toString() }];
    });
  };

  const deleteStudent = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setCurrentBookings((prev) => prev.filter((b) => b._id !== id));
  };

  const vacateSeat = (seatNumber) => {
    setCurrentBookings((prev) =>
      prev.map((b) => (parseInt(b.seat, 10) === parseInt(seatNumber, 10) ? { ...b, status: 'Inactive' } : b))
    );
  };

  const registerLibrary = async (libraryData) => {
    try {
      const { createLibrary } = require('../services/libraryService');
      const lib = await createLibrary(libraryData);
      setCurrentLibrary(lib);
      return lib;
    } catch (error) {
      console.warn('Backend registration failed, using local mock fallback:', error.message);
      const mockLib = {
        _id: 'dummy-lib-1',
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
      };
      setCurrentLibrary(mockLib);
      return mockLib;
    }
  };

  // Get owner library
  const getOwnerLibrary = () => libraries.find((l) => l.id === ownerData.libraryId) || libraries[0];

  // Update owner library details (for edit form)
  const updateOwnerLibrary = async (updates) => {
    if (currentLibrary && currentLibrary._id) {
      try {
        const { updateLibrary } = require('../services/libraryService');
        const updatedLib = await updateLibrary(currentLibrary._id, updates);
        setCurrentLibrary(updatedLib);
        return updatedLib;
      } catch (error) {
        console.warn('Backend update failed, applying locally:', error.message);
        setCurrentLibrary(prev => ({ ...prev, ...updates }));
      }
    } else {
      // Local fallback
      setCurrentLibrary(prev => prev ? { ...prev, ...updates } : null);
    }

    const libId = ownerData.libraryId;
    setLibraries((prev) =>
      prev.map((lib) => (lib.id === libId ? { ...lib, ...updates } : lib))
    );
  };

  return (
    <AppContext.Provider
      value={{
        userRole, setUserRole,
        ownerData, setOwnerData,
        studentData, setStudentData,
        libraries, setLibraries,
        savedLibraryIds, toggleSaveLibrary,
        seatStates, setSeatStates,
        students, setStudents,
        payments, setPayments,
        activities, setActivities,
        addPayment,
        saveStudent, deleteStudent,
        vacateSeat,
        updateLibrarySeats,
        getOwnerLibrary,
        updateOwnerLibrary,
        registerLibrary,
        currentLibrary, currentBookings, setCurrentBookings,
        fetchDashboardData, loading,
        isDarkMode, setIsDarkMode, theme,
        // Revenue tracking
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
