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
  const [libraries, setLibraries] = useState(dummyLibraries);
  const [savedLibraryIds, setSavedLibraryIds] = useState([]);
  const [seatStates, setSeatStates] = useState({}); // { libraryId: [true, false, ...] }
  const [students, setStudents] = useState([
    { id: '1', name: 'Aman Sharma', phone: '9876543210', seat: '12', plan: 'Full Time', expiry: '2026-04-17', status: 'Expiring' },
    { id: '2', name: 'Priya Verma', phone: '9123456789', seat: '05', plan: 'Half Time', expiry: '2026-04-15', status: 'Active' },
  ]);
  const [payments, setPayments] = useState([
    { id: '1', studentId: '1', amount: 800, date: '2024-04-15', method: 'UPI' },
    { id: '2', studentId: '2', amount: 400, date: '2024-04-16', method: 'Cash' },
  ]);
  const [activities, setActivities] = useState([
    { id: '1', type: 'join', text: 'Aman Sharma joined the library', time: '2h ago' },
    { id: '2', type: 'payment', text: 'Priya Verma paid ₹400', time: '5h ago' },
  ]);

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
  };

  // Get owner library
  const getOwnerLibrary = () => libraries.find((l) => l.id === ownerData.libraryId) || libraries[0];

  // Update owner library details (for edit form)
  const updateOwnerLibrary = (updates) => {
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
        updateLibrarySeats,
        getOwnerLibrary,
        updateOwnerLibrary,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
