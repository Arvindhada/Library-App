import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { updateLibrary } from '../../src/services/libraryService';
import { useApp } from '../../src/context/AppContext';

export default function EditLibrary() {
  const router = useRouter();
  const { currentLibrary, fetchDashboardData } = useApp();
  const [loading, setLoading] = useState(false);

  const FACILITY_OPTIONS = [
    'WiFi', 'AC', 'CCTV', 'RO Water', 'Parking', 'Charging Point', 'Silent Zone', 'Study Room', 'Locker Facility'
  ];

  const [form, setForm] = useState({
    name: '',
    address: '',
    total_seats: '',
    halfTimeFee: '',
    fullTimeFee: '',
    whatsapp: '',
    selectedFacilities: [],
    otherFacilities: '',
  });

  useEffect(() => {
    if (currentLibrary) {
      const existingFacilities = currentLibrary.facilities || [];
      const predefined = existingFacilities.filter(f => FACILITY_OPTIONS.includes(f) || ['wifi', 'ac', 'water'].includes(f.toLowerCase()));
      // Map legacy names to new names
      const mappedPredefined = predefined.map(f => {
        if (f.toLowerCase() === 'wifi') return 'WiFi';
        if (f.toLowerCase() === 'ac') return 'AC';
        if (f.toLowerCase() === 'water') return 'RO Water';
        return f;
      });
      
      const customFacilities = existingFacilities.filter(f => !FACILITY_OPTIONS.includes(f) && !['wifi', 'ac', 'water'].includes(f.toLowerCase())).join(', ');

      setForm({
        name: currentLibrary.name || '',
        address: currentLibrary.address || '',
        total_seats: currentLibrary.total_seats ? currentLibrary.total_seats.toString() : '',
        halfTimeFee: currentLibrary.half_time_fee ? currentLibrary.half_time_fee.toString() : '',
        fullTimeFee: currentLibrary.full_time_fee ? currentLibrary.full_time_fee.toString() : '',
        whatsapp: currentLibrary.whatsapp || '',
        selectedFacilities: mappedPredefined,
        otherFacilities: customFacilities,
      });
    }
  }, [currentLibrary]);

  const handleSave = async () => {
    if (!form.name || !form.address || !form.total_seats || !form.fullTimeFee) {
      if (Platform.OS === 'web') window.alert('Please fill all mandatory fields');
      else Alert.alert('Error', 'Please fill all mandatory fields');
      return;
    }

    setLoading(true);
    try {
      let facilities = [...form.selectedFacilities];
      if (form.otherFacilities.trim()) {
        const others = form.otherFacilities.split(',').map(f => f.trim()).filter(f => f.length > 0);
        facilities = [...facilities, ...others];
      }

      const payload = {
        name: form.name,
        address: form.address,
        total_seats: Number(form.total_seats),
        half_time_fee: Number(form.halfTimeFee || 0),
        full_time_fee: Number(form.fullTimeFee),
        wifi_available: facilities.includes('WiFi'),
        ac_available: facilities.includes('AC'),
        whatsapp: form.whatsapp,
        facilities
      };

      await updateLibrary(currentLibrary._id, payload);
      
      if (Platform.OS === 'web') window.alert('Library updated successfully!');
      else Alert.alert('✅ Success', 'Library updated successfully!');
      
      await fetchDashboardData(); 
      router.back();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Could not update library';
      if (Platform.OS === 'web') window.alert('Update Failed: ' + msg);
      else Alert.alert('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={s.heading}>Edit Library</Text>
        <Text style={s.sub}>Update your library details below</Text>

        <View style={s.form}>
          <Text style={s.label}>Library Name *</Text>
          <TextInput 
            style={s.input} 
            placeholder="e.g. Dream Study Library" 
            value={form.name} 
            onChangeText={(v) => setForm({...form, name: v})}
          />

          <Text style={s.label}>Complete Address *</Text>
          <TextInput 
            style={[s.input, { height: 80, textAlignVertical: 'top' }]} 
            placeholder="Street, City, Pincode" 
            multiline 
            value={form.address} 
            onChangeText={(v) => setForm({...form, address: v})}
          />

          <View style={s.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={s.label}>Total Seats *</Text>
              <TextInput 
                style={s.input} 
                placeholder="50" 
                keyboardType="numeric"
                value={form.total_seats} 
                onChangeText={(v) => setForm({...form, total_seats: v})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Full Time Fee *</Text>
              <TextInput 
                style={s.input} 
                placeholder="₹800" 
                keyboardType="numeric"
                value={form.fullTimeFee} 
                onChangeText={(v) => setForm({...form, fullTimeFee: v})}
              />
            </View>
          </View>

          <Text style={s.label}>Half Time Fee (Optional)</Text>
          <TextInput 
            style={s.input} 
            placeholder="₹500" 
            keyboardType="numeric"
            value={form.halfTimeFee} 
            onChangeText={(v) => setForm({...form, halfTimeFee: v})}
          />

          <Text style={s.label}>WhatsApp Number (for Student Chat) *</Text>
          <TextInput 
            style={s.input} 
            placeholder="e.g. 9636973572" 
            keyboardType="phone-pad"
            value={form.whatsapp} 
            onChangeText={(v) => setForm({...form, whatsapp: v})}
          />

          <Text style={[s.label, { marginTop: 10 }]}>Facilities (Select all that apply)</Text>
          <View style={s.facilitiesGrid}>
            {FACILITY_OPTIONS.map((facility, index) => {
              const isSelected = form.selectedFacilities.includes(facility);
              return (
                <TouchableOpacity 
                  key={index}
                  style={[s.facilityBox, isSelected && s.facilityBoxSelected]}
                  onPress={() => {
                    const newSelected = isSelected 
                      ? form.selectedFacilities.filter(f => f !== facility)
                      : [...form.selectedFacilities, facility];
                    setForm({ ...form, selectedFacilities: newSelected });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                  <Text style={[s.facilityText, isSelected && s.facilityTextSelected]}>{facility}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.label}>Other Facilities (Optional)</Text>
          <TextInput 
            style={[s.input, { height: 80, textAlignVertical: 'top' }]} 
            placeholder="Write any other facility (comma separated)..." 
            multiline 
            value={form.otherFacilities} 
            onChangeText={(v) => setForm({...form, otherFacilities: v})}
          />


          <TouchableOpacity 
            style={[s.saveBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={s.saveText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: 24, paddingTop: 56, flexGrow: 1 },
  back: { marginBottom: 24, padding: 4, alignSelf: 'flex-start' },
  heading: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 6 },
  sub: { fontSize: 15, color: colors.textSecondary, marginBottom: 32 },
  form: { marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, padding: 14, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.bgLight, marginBottom: 20 },
  row: { flexDirection: 'row' },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  facilityBox: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, marginBottom: 12, backgroundColor: colors.white },
  facilityBoxSelected: { borderColor: colors.primary, backgroundColor: colors.bgLight },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.cardBorder, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  facilityText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  facilityTextSelected: { color: colors.textPrimary, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 40 },
  saveText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
