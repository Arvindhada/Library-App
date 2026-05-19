import { Linking, Alert, Platform } from 'react-native';

// Open WhatsApp with pre-filled message for Owner
export const openWhatsAppToOwner = async (phone, libraryName, studentName, bookingInfo = {}) => {
  console.log('[WhatsApp] Attempting to open chat for:', phone);
  try {
    if (!phone) {
      if (Platform.OS === 'web') window.alert('Error: Owner phone number not found. Please ensure the library owner has provided a WhatsApp number.');
      else Alert.alert('Error', 'Owner phone number not found. Please ensure the library owner has provided a WhatsApp number.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    
    let message = `Hello! 👋\n\nI am *${studentName || 'a student'}*. I'm messaging regarding my booking at *${libraryName}*.`;
    
    if (bookingInfo.seat) {
      message += `\n\n*Booking Details:* \n- Seat: ${bookingInfo.seat}\n- Shift: ${bookingInfo.shift || 'N/A'}`;
    }
    
    message += `\n\nI have a query. Please let me know when you're available to chat. Thank you!`;

    const webUrl = `https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(message)}`;
    
    if (Platform.OS === 'web') {
      console.log('[WhatsApp] Opening Web URL:', webUrl);
      window.open(webUrl, '_blank');
    } else {
      console.log('[WhatsApp] Opening App URL:', webUrl);
      Linking.openURL(webUrl).catch((err) => {
        console.error('[WhatsApp] Failed to open URL:', err);
        Alert.alert('Error', 'Could not open WhatsApp. Please make sure it is installed.');
      });
    }
  } catch (e) {
    console.error('[WhatsApp] Unexpected error:', e);
    Alert.alert('Error', 'WhatsApp could not be opened.');
  }
};

// Open WhatsApp with pre-filled message
export const openWhatsApp = async (phone, libraryName, slotType = 'Full Time') => {
  console.log('[WhatsApp] Attempting to open chat for:', phone);
  try {
    if (!phone) {
      if (Platform.OS === 'web') window.alert('Error: Contact number not available.');
      else Alert.alert('Error', 'Contact number not available.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const message = `Hello! I found *${libraryName}* on LibraryWala. I am interested in a ${slotType} seat. Could you please share availability and details?`;
    
    const webUrl = `https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(message)}`;

    if (Platform.OS === 'web') {
      console.log('[WhatsApp] Opening Web URL:', webUrl);
      window.open(webUrl, '_blank');
    } else {
      console.log('[WhatsApp] Opening App URL:', webUrl);
      Linking.openURL(webUrl).catch((err) => {
        console.error('[WhatsApp] Failed to open URL:', err);
        Alert.alert('Error', 'Could not open WhatsApp. Please make sure it is installed.');
      });
    }
  } catch (e) {
    console.error('[WhatsApp] Unexpected error:', e);
    Alert.alert('Error', 'WhatsApp could not be opened.');
  }
};

// Send Fee Reminder Message
export const sendFeeReminder = async (phone, studentName, amount, libraryName) => {
  try {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const message = `Hello ${studentName}! 👋\n\nThis is a friendly reminder that your library fee of ₹${amount} for *${libraryName}* is due. 📚\n\nPlease pay to continue your library access seamlessly. Thank you! 🙏`;
    
    const webUrl = `https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(message)}`;

    if (Platform.OS === 'web') {
      window.open(webUrl, '_blank');
    } else {
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Error', 'Could not open WhatsApp.');
      });
    }
  } catch (e) {
    Alert.alert('Error', 'WhatsApp could not be opened.');
  }
};
