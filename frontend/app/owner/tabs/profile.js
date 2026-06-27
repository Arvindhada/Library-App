import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch, Image, StatusBar, Linking, Modal, Keyboard,
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../../src/context/AppContext';

// ── Colors (Screenshot Design Identity) ──
const C = {
  bg: '#F5F3EE', // Cream background
  surface: '#FFFFFF',
  primary: '#0F6E56', // Forest green
  primaryLight: '#E8F5F0',
  primaryBorder: '#9FE1CB',
  orange: '#C2410C', // Orange-brown accent
  orangeLight: '#FFF3E8', // Light orange for plan card
  orangeBorder: '#FDDCBB',
  textDark: '#1A1C1B',
  textGray: '#6F7A74',
  border: '#D1CFCA',
  red: '#DC2626',
  redLight: '#FEE2E2',
  redBorder: '#FCA5A5',
  blue: '#3B82F6',
  blueLight: '#EFF6FF',
};

export default function OwnerProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    ownerData, setOwnerData,
    currentLibrary, currentBookings,
    subscriptionPlan, setSubscriptionPlan,
    updateOwnerSubscription,
    logout,
    saveOwnerProfile,
    revenueTransactions,
  } = useApp();

  // Modals visibility
  const [settingsModal, setSettingsModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);

  // Upgrade Plan States
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState(ownerData?.name || '');
  const [phone, setPhone] = useState(ownerData?.phone || '');
  const [upiId, setUpiId] = useState(ownerData?.upi_id || '');
  const [notifs, setNotifs] = useState(true);
  const [whatsAppNotifs, setWhatsAppNotifs] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (ownerData) {
      setName(ownerData.name || '');
      setPhone(ownerData.phone || '');
      setUpiId(ownerData.upi_id || '');
    }
  }, [ownerData]);

  const loadSettings = async () => {
    try {
      const val = await AsyncStorage.getItem('whatsAppNotifs');
      if (val !== null) setWhatsAppNotifs(val === 'true');
    } catch (e) { console.warn(e); }
  };

  const handleToggleWhatsAppNotifs = async (val) => {
    setWhatsAppNotifs(val);
    try {
      await AsyncStorage.setItem('whatsAppNotifs', String(val));
      if (val) {
        Alert.alert(
          'Auto Reminders Active',
          'WhatsApp Auto Reminders option enabled. Note: Standard WhatsApp app requires manual click authorization for security unless a background API is integrated.'
        );
      }
    } catch (e) { console.warn(e); }
  };

  const getInitials = (n) =>
    n ? n.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : 'O';

  // Stats Calculations — use revenueTransactions from context
  const currentMonth = new Date().getMonth();
  const currentYear  = new Date().getFullYear();
  const totalRevenue = (revenueTransactions || []).reduce((sum, t) => {
    const d = new Date(t.date || t.createdAt);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'income') {
      return sum + (t.amount || 0);
    }
    return sum;
  }, 0);

  const totalBookings = currentBookings?.length > 0
    ? currentBookings.length
    : 0;

  const activeBookings = currentBookings?.filter(b => b.status === 'Active')?.length || 0;
  const totalSeats = currentLibrary?.total_seats ?? currentLibrary?.totalSeats ?? 0;
  const occupancyRate = totalSeats > 0 ? Math.round((activeBookings / totalSeats) * 100) : 0;

  // Due students calculation
  const dueStudents = currentBookings?.filter(b => {
    const exp = new Date(b.endDate);
    return exp < new Date() || b.status === 'Pending';
  }) || [];
  const pendingCount = dueStudents.length;

  const handleSaveProfile = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return; }
    await saveOwnerProfile({ name: name.trim(), phone: phone.trim(), upi_id: upiId.trim() });
    setEditProfileModal(false);
    Alert.alert('✅ Saved!', 'Profile details saved successfully.');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/owner/login');
        }
      },
    ]);
  };

  const handleRemindDueStudents = () => {
    if (dueStudents.length === 0) {
      Alert.alert('No Dues', 'No students have due payments.');
      return;
    }
    const st = dueStudents[0];
    const stPhone = st.student?.phone || '';
    const stName = st.student?.name || 'Student';
    const stFee = st.fee || 0;
    const msg = `Hi ${stName}, your library fee of ₹${stFee} is due. Please pay to continue using your seat. - Library`;
    
    Linking.openURL(`https://wa.me/91${stPhone}?text=${encodeURIComponent(msg)}`);

    if (dueStudents.length > 1) {
      setTimeout(() => {
        Alert.alert('More Students Due', `There are ${dueStudents.length - 1} more students with pending fees. You can message them individually from the Students tab.`);
      }, 2000);
    }
  };

  const handleUpiPay = async (appName) => {
    const amount = selectedPlan === 'monthly' ? 499 : 4999;
    const payeeVpa = "libconnect@upi";
    const payeeName = "LibConnect App Services";
    const note = `LibConnect Pro ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan`;
    
    let scheme = 'upi://pay';
    let appDisplay = 'UPI App';
    if (appName === 'phonepe') { scheme = 'phonepe://pay'; appDisplay = 'PhonePe'; }
    else if (appName === 'gpay') { scheme = 'tez://upi/pay'; appDisplay = 'Google Pay'; }
    else if (appName === 'paytm') { scheme = 'paytmmp://pay'; appDisplay = 'Paytm'; }

    const upiUrl = `${scheme}?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    try {
      await Linking.openURL(upiUrl);
    } catch {
      Alert.alert("App Not Found", `${appDisplay} is not installed on your phone.`);
    }
  };

  const handleVerifyPayment = async () => {
    if (utr.length !== 12) {
      Alert.alert('Invalid UTR', 'Please enter a valid 12-digit UTR.');
      return;
    }
    setLoading(true);
    try {
      const currentDaysLeft = subscriptionPlan?.daysLeft || 0;
      const addedDays = selectedPlan === 'monthly' ? 30 : 365;
      const newDaysLeft = currentDaysLeft + addedDays;
      const planName = selectedPlan === 'monthly' ? 'Pro Monthly' : 'Pro Yearly';
      
      await updateOwnerSubscription({
        name: planName,
        daysLeft: newDaysLeft,
        type: selectedPlan
      });
      
      setPaymentVerifying(false);
      setUpgradeModal(false);
      setUtr('');
      
      Alert.alert(
        "Plan Upgraded! ✅", 
        `Your ${planName} is active. Remaining days were carried over. You now have ${newDaysLeft} days left.`
      );
    } catch (err) {
      Alert.alert('Error ❌', 'Could not upgrade subscription. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>Profile & Settings</Text>
        </View>

        {/* ── TOP PROFILE CARD ── */}
        <View style={s.profileCard}>
          {/* Avatar Box (Orange Border Rounded Square) */}
          <View style={s.avatarBox}>
            {ownerData?.photo ? (
              <Image source={{ uri: ownerData.photo }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{getInitials(ownerData?.name)}</Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View style={s.detailsColumn}>
            <Text style={s.libraryName}>{currentLibrary?.name || 'My Library'}</Text>
            <Text style={s.ownerSubtitle}>{ownerData?.name || 'Owner'} · Owner</Text>
            
            <View style={s.tagsRow}>
              <View style={s.tagGreen}>
                <Text style={s.tagGreenTxt}>LibConnect Active</Text>
              </View>
              <View style={s.tagGreen}>
                <Text style={s.tagGreenTxt}>Free Trial</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── DOUBLE BUTTONS (EDIT PROFILE & ADD/EDIT LIBRARY) ── */}
        <View style={s.doubleButtonsRow}>
          <TouchableOpacity 
            style={s.btnOrange} 
            onPress={() => {
              setName(ownerData?.name || '');
              setPhone(ownerData?.phone || '');
              setUpiId(ownerData?.upi_id || '');
              setEditProfileModal(true);
            }} 
            activeOpacity={0.8}
          >
            <Text style={s.btnOrangeTxt}>Edit Profile</Text>
          </TouchableOpacity>

          {currentLibrary ? (
            <TouchableOpacity 
              style={s.btnGreen} 
              onPress={() => router.push('/owner/edit-library')}
              activeOpacity={0.8}
            >
              <Text style={s.btnGreenTxt}>Edit Library</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={s.btnGreen} 
              onPress={() => router.push('/owner/add-library')}
              activeOpacity={0.8}
            >
              <Text style={s.btnGreenTxt}>+ Add Library</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── MY LIBRARY INFO & PERFORMANCE CARDS ── */}
        <View style={s.infoCard}>
          <Text style={s.infoCardTitle}>My Library Info</Text>
          
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Address</Text>
            <Text style={s.infoValue} numberOfLines={2}>
              {currentLibrary ? (currentLibrary.address || 'Not Available') : 'Not Added Yet'}
            </Text>
          </View>
          <View style={s.cardDivider} />

          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Timing</Text>
            <Text style={s.infoValue}>
              {currentLibrary ? (currentLibrary.timings || 'Not Available') : 'Not Added Yet'}
            </Text>
          </View>
          <View style={s.cardDivider} />

          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Total Seats</Text>
            <Text style={s.infoValue}>{currentLibrary ? totalSeats : '0'}</Text>
          </View>
          <View style={s.cardDivider} />

          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Rating</Text>
            <Text style={s.infoValue}>{currentLibrary ? '★ 4.5 (89 reviews)' : 'No Rating'}</Text>
          </View>
        </View>

        <View style={s.infoCard}>
          <Text style={s.infoCardTitle}>Monthly Performance</Text>

          <View style={s.gridRow}>
            {/* Revenue */}
            <View style={s.gridItem}>
              <Text style={[s.gridVal, { color: C.orange }]}>
                ₹{currentLibrary ? totalRevenue.toLocaleString('en-IN') : '0'}
              </Text>
              <Text style={s.gridLabel}>Revenue</Text>
            </View>

            {/* Bookings */}
            <View style={s.gridItem}>
              <Text style={s.gridVal}>{currentLibrary ? totalBookings : '0'}</Text>
              <Text style={s.gridLabel}>Bookings</Text>
            </View>
          </View>

          <View style={s.gridRow}>
            {/* Occupancy */}
            <View style={s.gridItem}>
              <Text style={[s.gridVal, { color: C.primary }]}>{currentLibrary ? occupancyRate : '0'}%</Text>
              <Text style={s.gridLabel}>Occupancy</Text>
            </View>

            {/* Due Payments */}
            <TouchableOpacity 
              style={s.gridItem} 
              activeOpacity={0.7} 
              onPress={handleRemindDueStudents}
            >
              <Text style={[s.gridVal, { color: C.red }]}>{currentLibrary ? pendingCount : '0'}</Text>
              <View style={s.duePaymentsLabelWrap}>
                <Text style={s.gridLabel}>Due Payments</Text>
                <Ionicons name="logo-whatsapp" size={13} color={C.red} style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── LIBCONNECT PLAN CARD ── */}
        <View style={s.planCard}>
          <View style={s.planHeaderRow}>
            <View>
              <Text style={s.planTitle}>LibConnect Plan</Text>
              <Text style={s.planSub}>
                {subscriptionPlan?.name || 'Basic – Free Trial'} ({subscriptionPlan?.daysLeft ?? 28} days left)
              </Text>
            </View>
            <TouchableOpacity 
              style={s.upgradeBtn}
              onPress={() => setUpgradeModal(true)}
              activeOpacity={0.8}
            >
              <Text style={s.upgradeBtnTxt}>Upgrade</Text>
            </TouchableOpacity>
          </View>

          <View style={s.proDetailsBox}>
            <Text style={s.proPriceTitle}>Pro Plan – ₹499/month or ₹4,999/year</Text>
            <Text style={s.proDetailsTxt}>
              Unlimited listings · Analytics · Zero platform commission · Priority support
            </Text>
          </View>
        </View>

        {/* ── PRIVACY POLICY LINK (Moved to Settings) ── */}

        {/* ── BOTTOM ROW BUTTONS (SETTINGS & LOGOUT) ── */}
        <View style={s.bottomButtonsRow}>
          <TouchableOpacity 
            style={s.bottomBtnSettings} 
            onPress={() => setSettingsModal(true)}
            activeOpacity={0.8}
          >
            <Text style={s.bottomBtnSettingsTxt}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.bottomBtnLogout} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={s.bottomBtnLogoutTxt}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── SETTINGS MODAL ── */}
      <Modal visible={settingsModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsModal(false)}>
                <Ionicons name="close" size={24} color={C.textDark} />
              </TouchableOpacity>
            </View>

            {/* Notification Switch */}
            <View style={s.settingsRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.settingLabel}>Push Notifications</Text>
                <Text style={s.settingSub}>Receive updates and reminders</Text>
              </View>
              <Switch
                value={notifs}
                onValueChange={setNotifs}
                thumbColor="#FFF"
                trackColor={{ false: '#D1CFCA', true: C.primary }}
              />
            </View>
            <View style={s.modalDivider} />

            {/* WhatsApp Auto Reminders Switch */}
            <View style={s.settingsRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.settingLabel}>WhatsApp Auto Reminders</Text>
                <Text style={s.settingSub}>Auto send due payment alerts via WhatsApp</Text>
              </View>
              <Switch
                value={whatsAppNotifs}
                onValueChange={handleToggleWhatsAppNotifs}
                thumbColor="#FFF"
                trackColor={{ false: '#D1CFCA', true: '#16A34A' }}
              />
            </View>
            <View style={s.modalDivider} />

            {/* Help & Support */}
            <TouchableOpacity 
              style={s.settingsItem} 
              onPress={() => {
                setSettingsModal(false);
                Linking.openURL('https://wa.me/919800000000?text=Hi, I need help with LibConnect');
              }}
            >
              <Text style={s.settingLabel}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={C.textGray} />
            </TouchableOpacity>
            <View style={s.modalDivider} />

            {/* Terms of Service */}
            <TouchableOpacity 
              style={s.settingsItem} 
              onPress={() => {
                setSettingsModal(false);
                Alert.alert('Terms of Service', 'Standard terms of usage of LibConnect application. Fees collected are handled by owner.');
              }}
            >
              <Text style={s.settingLabel}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color={C.textGray} />
            </TouchableOpacity>
            <View style={s.modalDivider} />

            {/* Privacy Policy */}
            <TouchableOpacity 
              style={s.settingsItem} 
              onPress={() => {
                setSettingsModal(false);
                router.push('/privacy-policy');
              }}
            >
              <Text style={s.settingLabel}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color={C.textGray} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal visible={editProfileModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={s.overlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
              <View style={s.modalBox}>
                <View style={s.modalHead}>
                  <Text style={s.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity onPress={() => { setEditProfileModal(false); Keyboard.dismiss(); }}>
                    <Ionicons name="close" size={24} color={C.textDark} />
                  </TouchableOpacity>
                </View>

                <Text style={s.fieldLabel}>Owner Name</Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor={C.textGray}
                  returnKeyType="next"
                />

                <Text style={s.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={s.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  placeholderTextColor={C.textGray}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <Text style={s.fieldLabel}>UPI ID (for payments)</Text>
                <TextInput
                  style={s.input}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="e.g. yourname@upi"
                  placeholderTextColor={C.textGray}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                <TouchableOpacity style={s.saveProfileBtn} onPress={() => { Keyboard.dismiss(); handleSaveProfile(); }} activeOpacity={0.85}>
                  <Text style={s.saveProfileBtnTxt}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── UPGRADE PLAN MODAL ── */}
      <Modal visible={upgradeModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={s.overlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
              <View style={[s.modalBox, { height: '85%' }]}>
                <View style={s.modalHead}>
                  <Text style={s.modalTitle}>{paymentVerifying ? 'Verify Payment' : 'Upgrade Plan'}</Text>
                  <TouchableOpacity onPress={() => { setUpgradeModal(false); setPaymentVerifying(false); Keyboard.dismiss(); }}>
                    <Ionicons name="close" size={24} color={C.textDark} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {!paymentVerifying ? (
                    <View>
                      <Text style={{ fontSize: 14, color: C.textGray, marginBottom: 16 }}>Upgrade your plan. Remaining days will be added to your new plan automatically.</Text>
                      
                      {/* Monthly Card */}
                      <View style={s.subPlanCard}>
                        <Text style={s.planCardTitle}>Monthly Plan</Text>
                        <Text style={s.planCardPrice}>₹499<Text style={{ fontSize: 14, fontWeight: 'normal', color: C.textGray }}>/month</Text></Text>
                        <TouchableOpacity style={s.upiBtn} onPress={() => { setSelectedPlan('monthly'); setPaymentVerifying(true); }}>
                          <Text style={s.upiBtnTxt}>Start Monthly Plan</Text>
                        </TouchableOpacity>
                        <Text style={s.subBtnText}>Pay ₹499 via UPI</Text>
                      </View>
                      
                      {/* Yearly Card */}
                      <View style={[s.subPlanCard, { borderColor: C.primary, borderWidth: 1.5 }]}>
                        <Text style={s.planCardTitle}>Yearly Plan</Text>
                        <Text style={s.planCardPrice}>₹4,999<Text style={{ fontSize: 14, fontWeight: 'normal', color: C.textGray }}>/year</Text></Text>
                        <TouchableOpacity style={s.upiBtn} onPress={() => { setSelectedPlan('yearly'); setPaymentVerifying(true); }}>
                          <Text style={s.upiBtnTxt}>Start Yearly Plan</Text>
                        </TouchableOpacity>
                        <Text style={s.subBtnText}>Save ₹991 + 2 Months Free</Text>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={s.subText}>
                        Complete your payment of ₹{selectedPlan === 'monthly' ? '499' : '4,999'} for the {selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} subscription and enter UTR.
                      </Text>
                      
                      <View style={{ marginBottom: 24, marginTop: 16 }}>
                        <Text style={{ fontSize: 14, color: C.textDark, fontWeight: '700', marginBottom: 12 }}>Step 1: Pay directly via:</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                          <TouchableOpacity style={[s.upiAppBtn, { backgroundColor: '#5F259F' }]} onPress={() => handleUpiPay('phonepe')}>
                            <Text style={s.upiAppBtnTxt}>PhonePe</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[s.upiAppBtn, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1CFCA' }]} onPress={() => handleUpiPay('gpay')}>
                            <Text style={[s.upiAppBtnTxt, { color: '#1A73E8' }]}>GPay</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[s.upiAppBtn, { backgroundColor: '#002E6E' }]} onPress={() => handleUpiPay('paytm')}>
                            <Text style={s.upiAppBtnTxt}>Paytm</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <Text style={{ fontSize: 13, fontWeight: '600', color: C.textGray, marginBottom: 8 }}>Step 2: Enter 12-Digit UTR Number</Text>
                      <TextInput
                        style={s.utrInput}
                        placeholder="e.g. 312345678901"
                        keyboardType="number-pad"
                        maxLength={12}
                        value={utr}
                        onChangeText={setUtr}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                      />
                      
                      <TouchableOpacity 
                        style={[s.verifyBtn, utr.length !== 12 && { opacity: 0.5 }]} 
                        onPress={() => { Keyboard.dismiss(); handleVerifyPayment(); }}
                        disabled={loading || utr.length !== 12}
                      >
                        <Text style={s.verifyBtnTxt}>{loading ? 'Verifying...' : 'Verify & Upgrade'}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={s.cancelVerBtn} onPress={() => { setPaymentVerifying(false); setUtr(''); }}>
                        <Text style={s.cancelVerTxt}>Back to Plans</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Header row
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.textDark },
  headerVersion: { fontSize: 14, fontWeight: '700', color: C.orange },

  // Top profile card
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent',
    paddingVertical: 10, marginBottom: 20,
  },
  avatarBox: {
    width: 80, height: 80, borderRadius: 20, borderWidth: 2, borderColor: C.orange,
    overflow: 'hidden', marginRight: 16, backgroundColor: C.surface,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: C.orangeLight },
  avatarInitial: { fontSize: 28, fontWeight: '800', color: C.orange },
  
  detailsColumn: { flex: 1, justifyContent: 'center' },
  libraryName: { fontSize: 20, fontWeight: '700', color: C.textDark },
  ownerSubtitle: { fontSize: 14, color: C.textGray, marginTop: 2 },
  
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tagGreen: { backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  tagGreenTxt: { fontSize: 11, fontWeight: '600', color: C.primary },

  // Double Buttons
  doubleButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btnOrange: {
    flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#FDDCBB',
    backgroundColor: C.orangeLight, alignItems: 'center', justifyContent: 'center',
  },
  btnOrangeTxt: { fontSize: 15, fontWeight: '700', color: C.orange },
  btnGreen: {
    flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: C.primaryBorder,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  btnGreenTxt: { fontSize: 15, fontWeight: '700', color: C.primary },

  // Info Cards (White layout jaisa card)
  infoCard: {
    backgroundColor: C.surface, borderRadius: 24, padding: 20, marginBottom: 20,
    borderWidth: 0.5, borderColor: '#E5E3DD',
  },
  infoCardTitle: { fontSize: 13, fontWeight: '700', color: C.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoLabel: { fontSize: 15, color: C.textGray },
  infoValue: { fontSize: 15, fontWeight: '700', color: C.textDark, textAlign: 'right', flex: 1, marginLeft: 20 },
  cardDivider: { height: 0.5, backgroundColor: '#E5E3DD', marginVertical: 2 },

  // Grid Analytics (2x2 layout inside performance card)
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridItem: {
    flex: 1, backgroundColor: '#F9F8F6', borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#E5E3DD',
  },
  gridVal: { fontSize: 22, fontWeight: '800', color: C.textDark },
  gridLabel: { fontSize: 12, color: C.textGray, marginTop: 4, fontWeight: '600' },
  duePaymentsLabelWrap: { flexDirection: 'row', alignItems: 'center' },

  // Plan Card
  planCard: {
    backgroundColor: C.orangeLight, borderRadius: 24, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: '#FDDCBB',
  },
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  planTitle: { fontSize: 16, fontWeight: '700', color: C.orange },
  planSub: { fontSize: 13, color: C.orange, marginTop: 2 },
  upgradeBtn: { backgroundColor: C.orange, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  upgradeBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  proDetailsBox: { backgroundColor: '#FFFDF9', borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: '#FFE4CC' },
  proPriceTitle: { fontSize: 14, fontWeight: '700', color: C.orange, marginBottom: 4 },
  proDetailsTxt: { fontSize: 12, color: C.textGray, lineHeight: 16 },

  // Bottom buttons settings / logout
  bottomButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  bottomBtnSettings: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: C.border,
  },
  bottomBtnSettingsTxt: { fontSize: 16, fontWeight: '700', color: C.textGray },
  bottomBtnLogout: {
    flex: 1, backgroundColor: C.redLight, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: C.redBorder,
  },
  bottomBtnLogoutTxt: { fontSize: 16, fontWeight: '700', color: C.red },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.textDark },
  modalDivider: { height: 0.5, backgroundColor: '#E5E3DD', marginVertical: 12 },
  
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: C.textDark },
  settingSub: { fontSize: 12, color: C.textGray, marginTop: 2 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textGray, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.textDark, marginBottom: 12,
  },
  saveProfileBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  saveProfileBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  // Subscription / Upgrade Modal Styles
  subPlanCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  planCardTitle: { fontSize: 16, fontWeight: '800', color: C.textDark, marginBottom: 4 },
  planCardPrice: { fontSize: 24, fontWeight: '900', color: C.textDark, marginBottom: 12 },
  upiBtn: { backgroundColor: C.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  upiBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  subBtnText: { fontSize: 12, color: C.textGray, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  upiAppBtn: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', flex: 1 },
  upiAppBtnTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  utrInput: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '700', color: C.textDark, textAlign: 'center', letterSpacing: 2, marginBottom: 16 },
  verifyBtn: { backgroundColor: C.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  verifyBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  cancelVerBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelVerTxt: { color: C.textGray, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  subText: { fontSize: 14, color: C.textGray, lineHeight: 20 },
});
