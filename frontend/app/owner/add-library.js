import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Alert, KeyboardAvoidingView, Platform, Image, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { registerLibrary } = useApp();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
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
    photos: []
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
        photos: form.photos, // local URIs; in a real app, these would be uploaded to Firebase/S3 first
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

  // UI Renderers
  const renderStep1 = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Basic Details</Text>
      
      <Text style={s.label}>Library Name</Text>
      <TextInput style={s.input} placeholder="Dream Study Space" value={form.name} onChangeText={v => setForm({...form, name: v})} />

      <Text style={s.label}>Contact Number</Text>
      <TextInput style={s.input} placeholder="9876543210" keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm({...form, phone: v})} />

      <Text style={s.label}>Complete Address</Text>
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
        <View style={s.progressWrap}>
          <View style={[s.progressBar, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <Text style={s.stepInd}>{step}/3</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Buttons */}
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
});
