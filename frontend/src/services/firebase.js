// Firebase Service — Empty structure for backend dev
// Backend developer will add actual Firebase config

export const signInWithPhone = async (phone) => {
  console.log('Firebase: signInWithPhone', phone);
  return { success: true };
};

export const verifyOTP = async (verificationId, otp) => {
  console.log('Firebase: verifyOTP');
  return { success: true, user: { uid: 'mock_uid' } };
};

export const signOut = async () => {
  console.log('Firebase: signOut');
  return { success: true };
};

export const addLibrary = async (data) => {
  console.log('Firebase: addLibrary', data);
  return { success: true, id: 'mock_lib_id' };
};

export const updateLibrary = async (id, data) => {
  console.log('Firebase: updateLibrary', id);
  return { success: true };
};

export const getLibraries = async () => {
  console.log('Firebase: getLibraries');
  return { success: true, data: [] };
};

export const updateSeats = async (id, seats) => {
  console.log('Firebase: updateSeats', id, seats);
  return { success: true };
};

export const saveLibrary = async (userId, libraryId) => {
  console.log('Firebase: saveLibrary');
  return { success: true };
};

export const unsaveLibrary = async (userId, libraryId) => {
  console.log('Firebase: unsaveLibrary');
  return { success: true };
};
