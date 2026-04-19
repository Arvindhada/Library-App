import { Linking, Alert } from 'react-native';

// Open WhatsApp with pre-filled message
export const openWhatsApp = async (phone, libraryName, slotType = 'Full Time') => {
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const message = `Hello! I found ${libraryName} on LibConnect. I am interested in a ${slotType} seat. Could you please share availability and details?`;
    const url = `whatsapp://send?phone=${phoneWithCode}&text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`);
    }
  } catch (e) {
    Alert.alert('Error', 'WhatsApp could not be opened.');
  }
};

// Send Fee Reminder Message
export const sendFeeReminder = async (phone, studentName, amount, libraryName) => {
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const message = `Hello ${studentName}! 👋\n\nThis is a friendly reminder that your library fee of ₹${amount} for ${libraryName} is due. 📚\n\nPlease pay to continue your library access seamlessly. Thank you! 🙏`;
    
    const url = `whatsapp://send?phone=${phoneWithCode}&text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`);
    }
  } catch (e) {
    Alert.alert('Error', 'WhatsApp could not be opened.');
  }
};
