// Owner Library — Backend Connected Edit form
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../../../src/services/apiConfig';
import { FACILITIES_LIST } from '../../../src/constants/dummyData';

export default function OwnerLibrary() {
  const { currentLibrary, fetchDashboardData } = useApp();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [halfFee, setHalfFee] = useState('');
  const [fullFee, setFullFee] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState([]);

  // Load real library data into form fields
  useEffect(() => {
    if (currentLibrary) {
      setName(currentLibrary.name || '');
      setAddress(currentLibrary.address || '');
      setArea(currentLibrary.area || '');
      setTotalSeats(String(currentLibrary.total_seats || ''));
      setWhatsapp(currentLibrary.whatsapp || '');
      setOpenTime(currentLibrary.open_time || '');
      setHalfFee(String(currentLibrary.half_time_fee || ''));
      setFullFee(String(currentLibrary.full_time_fee || ''));
      setSelectedFacilities(currentLibrary.facilities || []);
    }
  }, [currentLibrary]);

  const toggleFacility = (id) => {
    setSelectedFacilities((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Error', 'Name and Address are required');
      return;
    }
    if (!currentLibrary?._id) {
      Alert.alert('Error', 'No library found. Please register first.');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(
        `${API_ENDPOINTS.LIBRARIES}/${currentLibrary._id}`,
        {
          name: name.trim(),
          address: address.trim(),
          area: area.trim(),
          total_seats: parseInt(totalSeats, 10) || currentLibrary.total_seats,
          whatsapp: whatsapp.trim(),
          open_time: openTime.trim(),
          half_time_fee: parseInt(halfFee, 10) || 0,
          full_time_fee: parseInt(fullFee, 10) || 0,
          facilities: selectedFacilities,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchDashboardData(); // Refresh context with new data
      setEditing(false);
      Alert.alert('✅ Saved!', 'Library details updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentLibrary) {
      setName(currentLibrary.name || '');
      setAddress(currentLibrary.address || '');
      setArea(currentLibrary.area || '');
      setTotalSeats(String(currentLibrary.total_seats || ''));
      setWhatsapp(currentLibrary.whatsapp || '');
      setOpenTime(currentLibrary.openTime || '');
      setHalfFee(String(currentLibrary.halfTime?.fee || ''));
      setFullFee(String(currentLibrary.fullTime?.fee || ''));
      setSelectedFacilities(currentLibrary.facilities || []);
    }
    setEditing(false);
  };

  if (!currentLibrary) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <Ionicons name="business-outline" size={60} color={colors.textLight} />
        <Text style={{ color: colors.textLight, marginTop: 16, fontSize: 16 }}>No Library Registered</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Go to Dashboard → Register Now</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.heading}>My Library</Text>
          <Text style={s.subHeading}>{currentLibrary.name}</Text>
        </View>

        {/* Form */}
        <View style={s.formCard}>
          <Field label="Library Name" value={name} onChangeText={setName} editing={editing} />
          <Field label="Full Address" value={address} onChangeText={setAddress} editing={editing} multiline />
          <Field label="Area / City" value={area} onChangeText={setArea} editing={editing} />
          <Field label="Total Seats" value={totalSeats} onChangeText={setTotalSeats} editing={editing} keyboardType="number-pad" />
          <Field label="WhatsApp Number" value={whatsapp} onChangeText={setWhatsapp} editing={editing} keyboardType="phone-pad" />
          <Field label="Open Time" value={openTime} onChangeText={setOpenTime} editing={editing} placeholder="e.g. 6AM - 10PM" />
          <Field label="Half Time Fee (₹/month)" value={halfFee} onChangeText={setHalfFee} editing={editing} keyboardType="number-pad" />
          <Field label="Full Time Fee (₹/month)" value={fullFee} onChangeText={setFullFee} editing={editing} keyboardType="number-pad" />
        </View>

        {/* Facilities */}
        <View style={s.section}>
          <Text style={s.secTitle}>Facilities</Text>
          <View style={s.facilityGrid}>
            {FACILITIES_LIST.map((f) => {
              const selected = selectedFacilities.includes(f.id);
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[s.facilityChip, selected && s.facilityChipActive]}
                  onPress={() => editing && toggleFacility(f.id)}
                  disabled={!editing}
                  activeOpacity={editing ? 0.7 : 1}
                >
                  <Text style={[s.facilityText, selected && s.facilityTextActive]}>{f.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Buttons */}
        {!editing ? (
          <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={20} color={colors.white} style={{ marginRight: 6 }} />
            <Text style={s.editBtnText}>Edit Library</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.editActions}>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={s.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Field = ({ label, value, onChangeText, editing, multiline = false, keyboardType = 'default', placeholder = '' }) => (
  <View style={fs.fieldWrap}>
    <Text style={fs.label}>{label}</Text>
    {editing ? (
      <TextInput
        style={[fs.input, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
      />
    ) : (
      <Text style={fs.value}>{value || '—'}</Text>
    )}
  </View>
);

const fs = StyleSheet.create({
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.bgLight },
  value: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: colors.primary },
  heading: { fontSize: 22, fontWeight: 'bold', color: colors.white },
  subHeading: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  formCard: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  secTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  facilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  facilityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white },
  facilityChipActive: { borderColor: colors.primary, backgroundColor: colors.lightOrangeBg },
  facilityText: { fontSize: 13, color: colors.textSecondary },
  facilityTextActive: { color: colors.primary, fontWeight: '600' },
  editBtn: { flexDirection: 'row', backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 20, paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  editActions: { paddingHorizontal: 16, marginTop: 20, gap: 10 },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  cancelBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
