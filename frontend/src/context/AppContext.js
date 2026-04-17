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

  // Get owner library
  const getOwnerLibrary = () => libraries.find((l) => l.id === ownerData.libraryId) || libraries[0];

  return (
    <AppContext.Provider
      value={{
        userRole, setUserRole,
        ownerData, setOwnerData,
        studentData, setStudentData,
        libraries, setLibraries,
        savedLibraryIds, toggleSaveLibrary,
        seatStates, setSeatStates,
        updateLibrarySeats,
        getOwnerLibrary,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
