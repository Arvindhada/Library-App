// Owner Library — Fully functional Edit form
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import { FACILITIES_LIST } from '../../../src/constants/dummyData';

export default function OwnerLibrary() {
  const { getOwnerLibrary, updateOwnerLibrary } = useApp();
  const lib = getOwnerLibrary();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(lib?.name || '');
  const [address, setAddress] = useState(lib?.address || '');
  const [area, setArea] = useState(lib?.area || '');
  const [totalSeats, setTotalSeats] = useState(String(lib?.totalSeats || ''));
  const [whatsapp, setWhatsapp] = useState(lib?.whatsapp || '');
  const [openTime, setOpenTime] = useState(lib?.openTime || '');
  const [halfFee, setHalfFee] = useState(String(lib?.halfTime?.fee || ''));
  const [fullFee, setFullFee] = useState(String(lib?.fullTime?.fee || ''));
  const [selectedFacilities, setSelectedFacilities] = useState(lib?.facilities || []);

  const toggleFacility = (id) => {
    setSelectedFacilities((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Error', 'Name and Address are required');
      return;
    }
    updateOwnerLibrary({
      name: name.trim(),
      address: address.trim(),
      area: area.trim(),
      totalSeats: parseInt(totalSeats, 10) || lib.totalSeats,
      whatsapp: whatsapp.trim(),
      openTime: openTime.trim(),
      halfTime: { ...lib.halfTime, fee: parseInt(halfFee, 10) || lib.halfTime.fee },
      fullTime: { ...lib.fullTime, fee: parseInt(fullFee, 10) || lib.fullTime.fee },
      facilities: selectedFacilities,
    });
    setEditing(false);
    Alert.alert('Saved!', 'Library details updated successfully');
  };

  const handleCancel = () => {
    // Reset to lib values
    setName(lib?.name || '');
    setAddress(lib?.address || '');
    setArea(lib?.area || '');
    setTotalSeats(String(lib?.totalSeats || ''));
    setWhatsapp(lib?.whatsapp || '');
    setOpenTime(lib?.openTime || '');
    setHalfFee(String(lib?.halfTime?.fee || ''));
    setFullFee(String(lib?.fullTime?.fee || ''));
    setSelectedFacilities(lib?.facilities || []);
    setEditing(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}><Text style={s.heading}>My Library</Text></View>

        {/* Photo */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoScroll}>
          {lib?.photos?.map((uri, i) => <Image key={i} source={{ uri }} style={s.photo} />)}
          <TouchableOpacity style={s.addPhoto}><Ionicons name="add" size={32} color={colors.primary} /><Text style={s.addText}>Add Photo</Text></TouchableOpacity>
        </ScrollView>

        {/* Form */}
        <View style={s.formCard}>
          <Field label="Library Name" value={name} onChangeText={setName} editing={editing} />
          <Field label="Full Address" value={address} onChangeText={setAddress} editing={editing} multiline />
          <Field label="Area / City" value={area} onChangeText={setArea} editing={editing} />
          <Field label="Total Seats" value={totalSeats} onChangeText={setTotalSeats} editing={editing} keyboardType="number-pad" />
          <Field label="WhatsApp Number" value={whatsapp} onChangeText={setWhatsapp} editing={editing} keyboardType="phone-pad" />
          <Field label="Open Time" value={openTime} onChangeText={setOpenTime} editing={editing} placeholder="e.g. 24 Hours or 6AM - 10PM" />
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
          <TouchableOpacity testID="edit-library-btn" style={s.editBtn} onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={20} color={colors.white} style={{ marginRight: 6 }} />
            <Text style={s.editBtnText}>Edit Library</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.editActions}>
            <TouchableOpacity testID="save-library-btn" style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="cancel-edit-btn" style={s.cancelBtn} onPress={handleCancel}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Reusable field: shows text when not editing, input when editing
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
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  photoScroll: { paddingHorizontal: 16, paddingVertical: 16 },
  photo: { width: 200, height: 140, borderRadius: 12, marginRight: 10, backgroundColor: colors.bgLight },
  addPhoto: { width: 120, height: 140, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addText: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '500' },
  formCard: { backgroundColor: colors.white, marginHorizontal: 16, borderRadius: 12, padding: 16 },
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
