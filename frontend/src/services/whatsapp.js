import { Linking, Alert } from 'react-native';

// Open WhatsApp with pre-filled message
export const openWhatsApp = async (phone, libraryName, slotType = 'Full Time') => {
  try {
    if (!phone || typeof phone !== 'string') {
      Alert.alert('Error', 'WhatsApp number is empty or invalid for this library.');
      return;
    }
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

// Send custom structured message
export const sendCustomWhatsApp = async (phone, message) => {
  try {
    if (!phone) {
      Alert.alert('Error', 'Phone number is empty or invalid.');
      return;
    }
    const cleanPhone = String(phone).replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`);
    
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

// Send Payment Receipt structured message
export const sendPaymentReceipt = async (phone, studentName, amount, method, libraryName, seat) => {
  try {
    if (!phone) return;
    const cleanPhone = String(phone).replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`);
    
    const message = `*Receipt from ${libraryName}* 📚\n\n` +
      `Dear *${studentName}*, your payment has been successfully recorded! ✅\n\n` +
      `🔹 *Amount:* ₹${amount}\n` +
      `🔹 *Method:* ${method}\n` +
      `🔹 *Seat:* ${seat || 'N/A'}\n` +
      `🔹 *Status:* Paid & Active (30 Days Validity Extended)\n\n` +
      `Thank you for studying with us! 📖✨`;

    const url = `whatsapp://send?phone=${phoneWithCode}&text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`);
    }
  } catch (e) {
    console.warn('Could not open WhatsApp for receipt:', e.message);
  }
};

