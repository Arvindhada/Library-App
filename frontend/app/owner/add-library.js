import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { createLibrary } from '../../src/services/libraryService';
import { useApp } from '../../src/context/AppContext';

export default function AddLibrary() {
  const router = useRouter();
  const { fetchDashboardData } = useApp();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    address: '',
    total_seats: '',
    halfTimeFee: '',
    fullTimeFee: '',
  });

  const handleSave = async () => {
    if (!form.name || !form.address || !form.total_seats || !form.fullTimeFee) {
      Alert.alert('Error', 'Please fill all mandatory fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        total_seats: Number(form.total_seats),
        available_seats: Number(form.total_seats),
        halfTime: { fee: Number(form.halfTimeFee || 0) },
        fullTime: { fee: Number(form.fullTimeFee) },
      };

      await createLibrary(payload);
      await fetchDashboardData(); // Refresh dashboard
      Alert.alert('Success', 'Library registered successfully!');
      router.replace('/owner/tabs');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not save library');
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

        <Text style={s.heading}>Register Library</Text>
        <Text style={s.sub}>Set up your library details to start managing students</Text>

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

          <TouchableOpacity 
            style={[s.saveBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={s.saveText}>{loading ? 'Saving...' : 'Register Library'}</Text>
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
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 40 },
  saveText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
