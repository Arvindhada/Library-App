import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';

// ── Colors (Stitch Design Identity) ──
const C = {
  bg: '#F5F3EE',
  surface: '#FFFFFF',
  primary: '#0F6E56',
  primaryLight: '#E8F5F0',
  primaryBorder: '#9FE1CB',
  textDark: '#1A1C1B',
  textGray: '#6F7A74',
  border: '#D1CFCA',
  red: '#DC2626',
  orange: '#C2410C',
};

export default function EditLibrary() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLibrary, updateOwnerLibrary } = useApp();
  const [loading, setLoading] = useState(false);

  // Initialize form states, accommodating both backend and dummy data schemas
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [fullTimeFee, setFullTimeFee] = useState('');
  const [halfTimeFee, setHalfTimeFee] = useState('');

  useEffect(() => {
    if (currentLibrary) {
      setName(currentLibrary.name || '');
      setAddress(currentLibrary.address || '');
      
      const seats = currentLibrary.total_seats ?? currentLibrary.totalSeats ?? '';
      setTotalSeats(seats.toString());

      const fullFee = currentLibrary.full_time_fee ?? currentLibrary.fullTime?.fee ?? '';
      setFullTimeFee(fullFee.toString());

      const halfFee = currentLibrary.half_time_fee ?? currentLibrary.halfTime?.fee ?? '';
      setHalfTimeFee(halfFee.toString());
    }
  }, [currentLibrary]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Kmi h', 'Library ka naam likhna zaroori hai.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Kmi h', 'Library ka address likhna zaroori hai.');
      return;
    }
    if (!totalSeats.trim() || isNaN(totalSeats) || Number(totalSeats) <= 0) {
      Alert.alert('Kmi h', 'Sahi seats count enter karein.');
      return;
    }
    if (!fullTimeFee.trim() || isNaN(fullTimeFee) || Number(fullTimeFee) <= 0) {
      Alert.alert('Kmi h', 'Full time fees enter karein.');
      return;
    }

    setLoading(true);
    try {
      // Map update fields according to schemas
      const payload = {
        name: name.trim(),
        address: address.trim(),
        total_seats: Number(totalSeats),
        totalSeats: Number(totalSeats),
        full_time_fee: Number(fullTimeFee),
        fullTime: { fee: Number(fullTimeFee) },
        half_time_fee: halfTimeFee.trim() ? Number(halfTimeFee) : 0,
        halfTime: { fee: halfTimeFee.trim() ? Number(halfTimeFee) : 0 }
      };

      await updateOwnerLibrary(payload);
      Alert.alert('Success ✅', 'Library details update ho gayi hain.');
      router.back();
    } catch (error) {
      Alert.alert('Error ❌', error.message || 'Details save nahi ho payi.');
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
          <View style={s.formCard}>
            <Text style={s.sectionHeader}>Library Information</Text>

            {/* Library Name */}
            <Text style={s.label}>Library Name *</Text>
            <View style={s.inputContainer}>
              <Ionicons name="business-outline" size={20} color={C.textGray} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="e.g. Premium Study Library"
                placeholderTextColor={C.textGray}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Address */}
            <Text style={s.label}>Complete Address *</Text>
            <View style={[s.inputContainer, { alignItems: 'flex-start', height: 80 }]}>
              <Ionicons name="location-outline" size={20} color={C.textGray} style={[s.inputIcon, { marginTop: 12 }]} />
              <TextInput
                style={[s.input, { height: '100%', textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Complete Address (Street, City, Pin)"
                placeholderTextColor={C.textGray}
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={s.row}>
              {/* Total Seats */}
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.label}>Total Seats *</Text>
                <View style={s.inputContainer}>
                  <Ionicons name="grid-outline" size={18} color={C.textGray} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="e.g. 50"
                    placeholderTextColor={C.textGray}
                    keyboardType="numeric"
                    value={totalSeats}
                    onChangeText={setTotalSeats}
                  />
                </View>
              </View>

              {/* Full Time Fee */}
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Full Time Fee *</Text>
                <View style={s.inputContainer}>
                  <Text style={s.currencyPrefix}>₹</Text>
                  <TextInput
                    style={s.input}
                    placeholder="e.g. 800"
                    placeholderTextColor={C.textGray}
                    keyboardType="numeric"
                    value={fullTimeFee}
                    onChangeText={setFullTimeFee}
                  />
                </View>
              </View>
            </View>

            {/* Half Time Fee */}
            <Text style={s.label}>Half Time Fee (Optional)</Text>
            <View style={s.inputContainer}>
              <Text style={s.currencyPrefix}>₹</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. 500"
                placeholderTextColor={C.textGray}
                keyboardType="numeric"
                value={halfTimeFee}
                onChangeText={setHalfTimeFee}
              />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textDark,
  },
  scroll: { flex: 1 },
  content: { padding: 16 },
  formCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 20,
    gap: 8,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: C.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textDark,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 8 },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textDark,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.textDark,
  },
  row: { flexDirection: 'row' },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
