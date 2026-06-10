import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform, StatusBar, Image, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApp } from '../../src/context/AppContext';

// ── Colors ──
const C = {
  bg: '#F5F3EE',
  surface: '#FFFFFF',
  primary: '#0F6E56', // App's Dark Green
  primaryLight: '#E8F5F0', // App's Soft Green
  primaryBorder: '#9FE1CB',
  textDark: '#1A1C1B',
  textGray: '#6F7A74',
  border: '#D1CFCA',
  red: '#DC2626',
};

const FACILITIES = [
  { id: 'wifi', label: 'High-Speed WiFi', icon: 'wifi' },
  { id: 'ac', label: 'Fully AC', icon: 'snow' },
  { id: 'ro', label: 'RO Water', icon: 'water' },
  { id: 'cctv', label: 'CCTV Security', icon: 'videocam' },
  { id: 'washroom', label: 'Washrooms', icon: 'man' },
  { id: 'discussion', label: 'Discussion Room', icon: 'chatbubbles' },
];

export default function EditLibrary() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLibrary, updateOwnerLibrary } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

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

  useEffect(() => {
    if (currentLibrary) {
      let openTime = '08:00 AM';
      let closeTime = '10:00 PM';
      if (currentLibrary.timings) {
        const parts = currentLibrary.timings.split(' to ');
        if (parts.length === 2) {
          openTime = parts[0];
          closeTime = parts[1];
        }
      }

      setForm({
        name: currentLibrary.name || '',
        address: currentLibrary.address || '',
        phone: currentLibrary.phone || '',
        openTime,
        closeTime,
        total_seats: (currentLibrary.total_seats ?? currentLibrary.totalSeats ?? '').toString(),
        fullTimeFee: (currentLibrary.full_time_fee ?? currentLibrary.fullTime?.fee ?? '').toString(),
        halfTimeFee: (currentLibrary.half_time_fee ?? currentLibrary.halfTime?.fee ?? '').toString(),
        facilities: currentLibrary.facilities || [],
        photos: currentLibrary.photos || [],
        coordinates: currentLibrary.coordinates || null,
      });
    }
  }, [currentLibrary]);

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

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
      Alert.alert('Incomplete', 'Please fill name, address, and phone number.');
      return;
    }
    if (!form.total_seats || isNaN(form.total_seats) || Number(form.total_seats) <= 0) {
      Alert.alert('Incomplete', 'Please enter a valid total seats count.');
      return;
    }
    if (!form.fullTimeFee || isNaN(form.fullTimeFee) || Number(form.fullTimeFee) <= 0) {
      Alert.alert('Incomplete', 'Please enter full time fee.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        timings: `${form.openTime} to ${form.closeTime}`,
        total_seats: Number(form.total_seats),
        totalSeats: Number(form.total_seats),
        full_time_fee: Number(form.fullTimeFee),
        fullTime: { fee: Number(form.fullTimeFee) },
        half_time_fee: form.halfTimeFee ? Number(form.halfTimeFee) : 0,
        halfTime: { fee: form.halfTimeFee ? Number(form.halfTimeFee) : 0 },
        facilities: form.facilities,
        photos: form.photos,
        coordinates: form.coordinates,
      };

      await updateOwnerLibrary(payload);
      Alert.alert('Success ✅', 'Library details updated successfully.');
      router.back();
    } catch (error) {
      Alert.alert('Error ❌', error.message || 'Could not update library details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      
      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={C.textDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Library Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={s.scroll} 
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── BASIC INFO ── */}
          <View style={s.formCard}>
            <Text style={s.sectionHeader}>Basic Information</Text>

            <Text style={s.label}>Library Name *</Text>
            <View style={s.inputContainer}>
              <Ionicons name="business-outline" size={20} color={C.textGray} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="e.g. Premium Study Library" placeholderTextColor={C.textGray} value={form.name} onChangeText={v => setForm({...form, name: v})} />
            </View>

            <Text style={s.label}>Contact Number *</Text>
            <View style={s.inputContainer}>
              <Ionicons name="call-outline" size={20} color={C.textGray} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="e.g. 9876543210" placeholderTextColor={C.textGray} keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm({...form, phone: v})} />
            </View>

            <Text style={s.label}>Complete Address *</Text>
            <View style={[s.inputContainer, { alignItems: 'flex-start', height: 80, paddingRight: 8, paddingVertical: 6 }]}>
              <TextInput 
                style={[s.input, { height: '100%', textAlignVertical: 'top', paddingTop: 4 }]} 
                placeholder="Complete Address (Street, City, Pin)" 
                placeholderTextColor={C.textGray} 
                multiline 
                numberOfLines={3} 
                value={form.address} 
                onChangeText={v => setForm({...form, address: v})} 
              />
              <TouchableOpacity 
                style={s.locIconBtn} 
                onPress={fetchLocation} 
                disabled={locLoading} 
                activeOpacity={0.7}
              >
                {locLoading ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <Ionicons name="location" size={20} color={C.primary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.label}>Opening Time</Text>
                <TextInput style={[s.input, { borderWidth: 0.5, borderColor: C.border, borderRadius: 12, padding: 12, backgroundColor: C.bg }]} placeholder="08:00 AM" placeholderTextColor={C.textGray} value={form.openTime} onChangeText={v => setForm({...form, openTime: v})} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Closing Time</Text>
                <TextInput style={[s.input, { borderWidth: 0.5, borderColor: C.border, borderRadius: 12, padding: 12, backgroundColor: C.bg }]} placeholder="10:00 PM" placeholderTextColor={C.textGray} value={form.closeTime} onChangeText={v => setForm({...form, closeTime: v})} />
              </View>
            </View>
          </View>

          {/* ── CAPACITY & PRICING ── */}
          <View style={s.formCard}>
            <Text style={s.sectionHeader}>Capacity & Pricing</Text>

            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.label}>Total Seats *</Text>
                <View style={s.inputContainer}>
                  <Ionicons name="grid-outline" size={18} color={C.textGray} style={s.inputIcon} />
                  <TextInput style={s.input} placeholder="e.g. 50" placeholderTextColor={C.textGray} keyboardType="numeric" value={form.total_seats} onChangeText={v => setForm({...form, total_seats: v})} />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.label}>Full Time Fee *</Text>
                <View style={s.inputContainer}>
                  <Text style={s.currencyPrefix}>₹</Text>
                  <TextInput style={s.input} placeholder="e.g. 800" placeholderTextColor={C.textGray} keyboardType="numeric" value={form.fullTimeFee} onChangeText={v => setForm({...form, fullTimeFee: v})} />
                </View>
              </View>
            </View>

            <Text style={s.label}>Half Time Fee (Optional)</Text>
            <View style={s.inputContainer}>
              <Text style={s.currencyPrefix}>₹</Text>
              <TextInput style={s.input} placeholder="e.g. 500" placeholderTextColor={C.textGray} keyboardType="numeric" value={form.halfTimeFee} onChangeText={v => setForm({...form, halfTimeFee: v})} />
            </View>
          </View>

          {/* ── AMENITIES ── */}
          <View style={s.formCard}>
            <Text style={s.sectionHeader}>Amenities</Text>
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

          {/* ── PHOTOS ── */}
          <View style={s.formCard}>
            <Text style={s.sectionHeader}>Live Photos</Text>
            <Text style={s.subText}>Capture the latest photos of your library space.</Text>
            
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

          {/* ── SAVE ACTION ── */}
          <TouchableOpacity 
            style={[s.saveBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={s.saveText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
  scroll: { flex: 1 },
  content: { padding: 16 },
  
  formCard: {
    backgroundColor: C.surface, borderRadius: 20, borderWidth: 0.5, borderColor: C.border,
    padding: 20, marginBottom: 20,
  },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 13, fontWeight: '600', color: C.textDark, marginBottom: 6 },
  
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 0.5, borderColor: C.border, height: 48, paddingHorizontal: 12, marginBottom: 16,
  },
  inputIcon: { marginRight: 8 },
  currencyPrefix: { fontSize: 16, fontWeight: '700', color: C.textDark, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: C.textDark },
  
  row: { flexDirection: 'row' },
  
  locIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  
  facGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  facBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 8 },
  facBtnSel: { borderColor: C.primary, backgroundColor: C.primaryLight },
  facTxt: { fontSize: 14, color: C.textGray, fontWeight: '500' },
  facTxtSel: { color: C.primary, fontWeight: '700' },
  
  subText: { fontSize: 13, color: C.textGray, marginBottom: 16, lineHeight: 18 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  addPhotoBtn: { width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderColor: C.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: C.primaryLight },
  addPhotoTxt: { fontSize: 12, fontWeight: '600', color: C.primary, marginTop: 4 },
  photoWrap: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  photoDel: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },
  
  saveBtn: {
    flexDirection: 'row', backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
