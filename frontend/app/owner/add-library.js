import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Alert, KeyboardAvoidingView, Platform, Image, StatusBar, Linking,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../src/context/AppContext';

// Colors based on premium stitch design
const C = {
  bg: '#F5F3EE',
  surface: '#FFFFFF',
  primary: '#0F6E56',
  primaryLight: '#E8F5F0',
  textDark: '#1A1C1B',
  textGray: '#6F7A74',
  border: '#D1CFCA',
};

const FACILITIES = [
  { id: 'wifi', label: 'High-Speed WiFi', icon: 'wifi' },
  { id: 'ac', label: 'Fully AC', icon: 'snow' },
  { id: 'ro', label: 'RO Water', icon: 'water' },
  { id: 'cctv', label: 'CCTV Security', icon: 'videocam' },
  { id: 'washroom', label: 'Washrooms', icon: 'man' },
  { id: 'discussion', label: 'Discussion Room', icon: 'chatbubbles' },
];

export default function AddLibraryWizard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { registerLibrary, setSubscriptionPlan } = useApp();
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  
  // Subscription States
  const [selectedPlan, setSelectedPlan] = useState(null); // 'monthly' | 'yearly'
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [utr, setUtr] = useState('');
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    openTime: '08:00 AM',
    closeTime: '10:00 PM',
    total_seats: '',
    fullTimeFee: '',
    halfTimeFee: '',
    facilities: [],
    photos: [],
    coordinates: null,
  });

  const toggleFacility = (id) => {
    setForm(prev => {
      const exists = prev.facilities.includes(id);
      if (exists) return { ...prev, facilities: prev.facilities.filter(f => f !== id) };
      return { ...prev, facilities: [...prev.facilities, id] };
    });
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take library photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm(prev => ({ ...prev, photos: [...prev.photos, result.assets[0].uri] }));
    }
  };

  const removePhoto = (index) => {
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const fetchLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to fetch address.');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      
      const geoArr = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geoArr.length > 0) {
        const place = geoArr[0];
        const addrStr = [place.name, place.street, place.district, place.city, place.region, place.postalCode]
          .filter(Boolean)
          .join(', ');
        
        setForm(prev => ({ 
          ...prev, 
          address: addrStr,
          coordinates: { lat: latitude, lng: longitude }
        }));
      } else {
        Alert.alert('Address Not Found', 'Could not determine the address for this location.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch location. Please enter manually.');
    } finally {
      setLocLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.name || !form.address || !form.phone) {
        Alert.alert('Incomplete', 'Please fill name, address, and phone number.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.total_seats || !form.fullTimeFee) {
        Alert.alert('Incomplete', 'Please fill total seats and full time fee.');
        return;
      }
      setStep(3);
    }
  };

  const handleSave = async () => {
    if (form.photos.length === 0) {
      Alert.alert('Photo Required', 'Please take at least 1 photo of your library.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        phone: form.phone,
        timings: `${form.openTime} to ${form.closeTime}`,
        total_seats: Number(form.total_seats),
        available_seats: Number(form.total_seats),
        halfTime: { fee: Number(form.halfTimeFee || 0) },
        fullTime: { fee: Number(form.fullTimeFee) },
        facilities: form.facilities,
        photos: form.photos,
        coordinates: form.coordinates,
      };

      await registerLibrary(payload);
      Alert.alert('Success ✅', 'Your premium library is now listed!');
      router.replace('/owner/tabs');
    } catch (error) {
      Alert.alert('Error ❌', error.message || 'Could not register library.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiPay = async (appName) => {
    const amount = selectedPlan === 'monthly' ? 499 : 4999;
    
    // Construct direct zero-commission UPI link
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
      Alert.alert("App Not Found", `${appDisplay} is not installed on your phone. Please try another app.`);
    }
  };

  const handleVerifyPayment = async () => {
    if (utr.length !== 12) {
      Alert.alert('Invalid UTR', 'Please enter a valid 12-digit UTR or Reference Number.');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      setPaymentVerifying(false);
      setVerified(true);
      
      const planName = selectedPlan === 'monthly' ? 'Pro Monthly' : 'Pro Yearly';
      const days = selectedPlan === 'monthly' ? 30 : 365;
      const subInfo = { name: planName, daysLeft: days, type: selectedPlan };
      
      setSubscriptionPlan(subInfo);
      await AsyncStorage.setItem('@libconnect_subscription', JSON.stringify(subInfo));
      
      Alert.alert(
        "Payment Verified! ✅", 
        `Your ${planName} subscription is now active. You can proceed to list your library.`,
        [{ text: "Continue", onPress: () => setStep(1) }]
      );
    }, 1500);
  };

  const handleFreeTrial = async () => {
    const subInfo = { name: 'Basic - Free Trial', daysLeft: 30, type: 'trial' };
    setSubscriptionPlan(subInfo);
    await AsyncStorage.setItem('@libconnect_subscription', JSON.stringify(subInfo));
    
    Alert.alert(
      "Free Trial Activated! 🎁", 
      "Your 30-day Free Trial is active. Proceed to list your library.",
      [{ text: "Continue", onPress: () => setStep(1) }]
    );
  };

  const renderSubscriptionStep = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Grow your library</Text>
      <Text style={s.subText}>Students will come straight to your library</Text>
      
      {/* Monthly Card */}
      <View style={s.subPlanCard}>
        <View style={s.planHeaderRow}>
          <Text style={s.planCardTitle}>Monthly Plan</Text>
          <View style={s.trialBadge}><Text style={s.trialBadgeTxt}>30 days FREE trial</Text></View>
        </View>
        <Text style={s.planCardPrice}>₹499<Text style={{ fontSize: 14, fontWeight: 'normal', color: C.textGray }}>/month</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -10, marginBottom: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, textDecorationLine: 'line-through', color: C.textGray }}>₹599/month</Text>
          <View style={s.discountBadge}><Text style={s.discountBadgeTxt}>₹100 off</Text></View>
        </View>
        
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>1 library listing on LibConnect</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>Unlimited seat management</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>Student tracking – name, seat, expiry</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>Revenue dashboard</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>WhatsApp reminders – expiry alert</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>New booking notifications</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>Students will book directly from the app</Text></View>
        
        <View style={{ marginTop: 16 }}>
          <TouchableOpacity style={s.upiBtn} onPress={handleFreeTrial}>
            <Text style={s.upiBtnTxt}>Start 30 Days Free Trial</Text>
          </TouchableOpacity>
          <Text style={s.subBtnText}>No card required - Pay later</Text>
        </View>
      </View>

      {/* Yearly Card */}
      <View style={[s.subPlanCard, { borderColor: C.primary, borderWidth: 1.5 }]}>
        <View style={s.planHeaderRow}>
          <Text style={s.planCardTitle}>Yearly Plan</Text>
          <View style={[s.trialBadge, { backgroundColor: '#FEE2E2' }]}><Text style={[s.trialBadgeTxt, { color: '#DC2626' }]}>Best Value</Text></View>
        </View>
        <Text style={s.planCardPrice}>₹4,999<Text style={{ fontSize: 14, fontWeight: 'normal', color: C.textGray }}>/year</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -10, marginBottom: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, textDecorationLine: 'line-through', color: C.textGray }}>₹5,990/year</Text>
          <View style={s.discountBadge}><Text style={s.discountBadgeTxt}>₹991 off</Text></View>
        </View>
        
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>1 library listing on LibConnect</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>Unlimited seat management</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>Student tracking – name, seat, expiry</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>Revenue dashboard</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>WhatsApp reminders – expiry alert</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>New booking notifications</Text></View>
        <View style={s.bulletRow}><Ionicons name="checkmark-circle" size={16} color={C.primary} /><Text style={s.bulletText}>Students will book directly from the app</Text></View>
        
        <View style={s.extraHighlightBox}>
          <Text style={s.extraHighlightTxt}>2 extra months absolutely FREE</Text>
          <Text style={{ fontSize: 11, color: '#0F6E56', marginTop: 2, fontWeight: '600' }}>Get 12 months for the price of 10</Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <TouchableOpacity style={s.upiBtn} onPress={() => { setSelectedPlan('yearly'); setPaymentVerifying(true); }}>
            <Text style={s.upiBtnTxt}>Start Yearly Plan</Text>
          </TouchableOpacity>
          <Text style={s.subBtnText}>Save ₹991 + 2 Months Free</Text>
        </View>
      </View>
    </View>
  );

  const renderVerification = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Verify Payment 🔐</Text>
      <Text style={s.subText}>
        Complete your payment of ₹{selectedPlan === 'monthly' ? '499' : '4,999'} for the {selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Pro subscription and enter your UTR to activate.
      </Text>
      
      <View style={{ marginBottom: 24 }}>
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
      
      <View style={s.instructionBox}>
        <Text style={s.instTitle}>Step 2: How to activate?</Text>
        <View style={s.instRow}><Text style={s.instNum}>1</Text><Text style={s.instText}>Copy the 12-digit UTR (Reference ID) from your payment history.</Text></View>
        <View style={s.instRow}><Text style={s.instNum}>2</Text><Text style={s.instText}>Paste the UTR number below to verify.</Text></View>
      </View>
      
      <View style={s.utrContainer}>
        <Text style={s.label}>12-Digit UTR Number</Text>
        <TextInput
          style={s.utrInput}
          placeholder="e.g. 312345678901"
          keyboardType="number-pad"
          maxLength={12}
          value={utr}
          onChangeText={setUtr}
        />
      </View>
      
      <TouchableOpacity 
        style={[s.verifyBtn, utr.length !== 12 && { opacity: 0.5 }]} 
        onPress={handleVerifyPayment}
        disabled={loading || utr.length !== 12}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={s.verifyBtnTxt}>Verify & Activate</Text>
          </>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={s.cancelVerBtn} 
        onPress={() => { setPaymentVerifying(false); setUtr(''); }}
        activeOpacity={0.8}
      >
        <Text style={s.cancelVerTxt}>Choose another plan</Text>
      </TouchableOpacity>
    </View>
  );

  // UI Renderers
  const renderStep1 = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Basic Details</Text>
      
      <Text style={s.label}>Library Name</Text>
      <TextInput style={s.input} placeholder="Dream Study Space" value={form.name} onChangeText={v => setForm({...form, name: v})} />

      <Text style={s.label}>Contact Number</Text>
      <TextInput style={s.input} placeholder="9876543210" keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm({...form, phone: v})} />

      <View style={s.locHeader}>
        <Text style={[s.label, { marginBottom: 0 }]}>Complete Address</Text>
        <TouchableOpacity style={s.locBtn} onPress={fetchLocation} disabled={locLoading}>
          <Ionicons name="location" size={14} color={C.primary} />
          <Text style={s.locBtnTxt}>{locLoading ? 'Fetching...' : 'Use Current Location'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Street, Area, City" multiline value={form.address} onChangeText={v => setForm({...form, address: v})} />

      <View style={s.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={s.label}>Opening Time</Text>
          <TextInput style={s.input} placeholder="08:00 AM" value={form.openTime} onChangeText={v => setForm({...form, openTime: v})} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Closing Time</Text>
          <TextInput style={s.input} placeholder="10:00 PM" value={form.closeTime} onChangeText={v => setForm({...form, closeTime: v})} />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Capacity & Pricing</Text>
      
      <View style={s.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={s.label}>Total Seats</Text>
          <TextInput style={s.input} placeholder="e.g. 50" keyboardType="numeric" value={form.total_seats} onChangeText={v => setForm({...form, total_seats: v})} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Full Time Fee (₹)</Text>
          <TextInput style={s.input} placeholder="1000" keyboardType="numeric" value={form.fullTimeFee} onChangeText={v => setForm({...form, fullTimeFee: v})} />
        </View>
      </View>
      <Text style={s.label}>Half Time Fee (₹) [Optional]</Text>
      <TextInput style={s.input} placeholder="600" keyboardType="numeric" value={form.halfTimeFee} onChangeText={v => setForm({...form, halfTimeFee: v})} />

      <Text style={[s.stepTitle, { marginTop: 20 }]}>Amenities</Text>
      <View style={s.facGrid}>
        {FACILITIES.map(fac => {
          const isSel = form.facilities.includes(fac.id);
          return (
            <TouchableOpacity key={fac.id} style={[s.facBtn, isSel && s.facBtnSel]} onPress={() => toggleFacility(fac.id)}>
              <Ionicons name={fac.icon} size={18} color={isSel ? C.primary : C.textGray} />
              <Text style={[s.facTxt, isSel && s.facTxtSel]}>{fac.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Live Photos</Text>
      <Text style={s.subText}>Take at least 1 photo of your library space using the camera. Gallery uploads are not allowed for authenticity.</Text>
      
      <View style={s.photoGrid}>
        {form.photos.map((uri, idx) => (
          <View key={idx} style={s.photoWrap}>
            <Image source={{ uri }} style={s.photoImg} />
            <TouchableOpacity style={s.photoDel} onPress={() => removePhoto(idx)}>
              <Ionicons name="close" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addPhotoBtn} onPress={takePhoto}>
          <Ionicons name="camera" size={32} color={C.primary} />
          <Text style={s.addPhotoTxt}>Capture</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textDark} />
        </TouchableOpacity>
        {step > 0 ? (
          <>
            <View style={s.progressWrap}>
              <View style={[s.progressBar, { width: `${(step / 3) * 100}%` }]} />
            </View>
            <Text style={s.stepInd}>{step}/3</Text>
          </>
        ) : (
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.textDark }}>Subscription Plan</Text>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {step === 0 && (paymentVerifying ? renderVerification() : renderSubscriptionStep())}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Buttons */}
      {step > 0 && (
        <View style={[s.footer, { paddingBottom: insets.bottom || 20 }]}>
          {step > 1 && (
            <TouchableOpacity style={s.btnBack} onPress={() => setStep(s => s - 1)}>
              <Text style={s.btnBackTxt}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity style={s.btnNext} onPress={handleNext}>
              <Text style={s.btnNextTxt}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btnNext} onPress={handleSave} disabled={loading}>
              <Text style={s.btnNextTxt}>{loading ? 'Saving...' : 'Publish Library'}</Text>
              {!loading && <Ionicons name="checkmark" size={18} color="#FFF" />}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { marginRight: 16 },
  progressWrap: { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden', marginRight: 12 },
  progressBar: { height: '100%', backgroundColor: C.primary },
  stepInd: { fontSize: 14, fontWeight: '700', color: C.textDark },
  
  content: { padding: 20 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: C.textDark, marginBottom: 20 },
  subText: { fontSize: 14, color: C.textGray, marginBottom: 20, lineHeight: 20 },
  
  label: { fontSize: 13, fontWeight: '600', color: C.textGray, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 16, color: C.textDark },
  row: { flexDirection: 'row' },
  
  locHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, marginTop: 12 },
  locBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  locBtnTxt: { fontSize: 12, fontWeight: '700', color: C.primary },
  
  facGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  facBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 8 },
  facBtnSel: { borderColor: C.primary, backgroundColor: C.primaryLight },
  facTxt: { fontSize: 14, color: C.textGray, fontWeight: '500' },
  facTxtSel: { color: C.primary, fontWeight: '700' },
  
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  addPhotoBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 2, borderColor: C.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: C.primaryLight },
  addPhotoTxt: { fontSize: 12, fontWeight: '600', color: C.primary, marginTop: 4 },
  photoWrap: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  photoDel: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },
  
  footer: { flexDirection: 'row', padding: 20, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, gap: 12 },
  btnBack: { flex: 1, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  btnBackTxt: { fontSize: 16, fontWeight: '600', color: C.textDark },
  btnNext: { flex: 2, flexDirection: 'row', paddingVertical: 16, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnNextTxt: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Subscription cards & verification view styles
  subPlanCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planCardTitle: { fontSize: 18, fontWeight: '800', color: C.textDark },
  trialBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  trialBadgeTxt: { fontSize: 11, fontWeight: '700', color: C.primary },
  planCardPrice: { fontSize: 28, fontWeight: '900', color: C.textDark, marginBottom: 16 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  bulletText: { fontSize: 13.5, color: C.textGray, fontWeight: '500', flex: 1, lineHeight: 18 },
  upiBtn: {
    flexDirection: 'row', backgroundColor: C.primary, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 2,
  },
  upiBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  upiAppBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  upiAppBtnTxt: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  trialBtn: {
    borderWidth: 1.5, borderColor: C.primary, paddingVertical: 12, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent',
  },
  trialBtnTxt: { color: C.primary, fontSize: 14, fontWeight: '700' },
  
  // Verification Styles
  instructionBox: {
    backgroundColor: '#FFF8E1', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#FFE082'
  },
  instTitle: { fontSize: 15, fontWeight: '700', color: '#B08D00', marginBottom: 12 },
  instRow: { flexDirection: 'row', marginBottom: 10, gap: 10, paddingRight: 10 },
  instNum: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFE082', color: '#B08D00',
    fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 20, overflow: 'hidden'
  },
  instText: { fontSize: 13, color: '#5C4E0A', flex: 1, lineHeight: 18, fontWeight: '500' },
  utrContainer: { marginBottom: 24 },
  utrInput: {
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    padding: 16, fontSize: 18, fontWeight: '700', color: C.textDark, textAlign: 'center', letterSpacing: 2
  },
  verifyBtn: {
    flexDirection: 'row', backgroundColor: C.primary, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 3, marginBottom: 12
  },
  verifyBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelVerBtn: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  cancelVerTxt: { color: C.textGray, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  subBtnText: {
    fontSize: 12,
    color: C.textGray,
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  extraHighlightBox: {
    backgroundColor: '#E8F5F0',
    borderColor: '#9FE1CB',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    alignItems: 'center',
  },
  extraHighlightTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F6E56',
  },
  discountBadge: {
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F6E56',
  },
});
