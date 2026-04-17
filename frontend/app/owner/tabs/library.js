import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import FacilityTag from '../../../src/components/FacilityTag';
import { FACILITIES_LIST } from '../../../src/constants/dummyData';

export default function OwnerLibrary() {
  const { getOwnerLibrary } = useApp();
  const lib = getOwnerLibrary();
  const facilities = lib?.facilities?.map((id) => FACILITIES_LIST.find((f) => f.id === id)).filter(Boolean) || [];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}><Text style={s.heading}>My Library</Text></View>

      {/* Photo */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoScroll}>
        {lib?.photos?.map((uri, i) => <Image key={i} source={{ uri }} style={s.photo} />)}
        <TouchableOpacity style={s.addPhoto}><Ionicons name="add" size={32} color={colors.primary} /><Text style={s.addText}>Add Photo</Text></TouchableOpacity>
      </ScrollView>

      <View style={s.card}>
        <Row label="Library Name" value={lib?.name} />
        <Row label="Address" value={lib?.address} />
        <Row label="Area/City" value={lib?.area} />
        <Row label="Total Seats" value={String(lib?.totalSeats)} />
        <Row label="WhatsApp" value={lib?.whatsapp} />
        <Row label="Open Time" value={lib?.openTime} />
      </View>

      <View style={s.section}>
        <Text style={s.secTitle}>Facilities</Text>
        <View style={s.facilityRow}>{facilities.map((f) => <FacilityTag key={f.id} facility={f} />)}</View>
      </View>

      <TouchableOpacity style={s.editBtn}><Text style={s.editBtnText}>Edit Library</Text></TouchableOpacity>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const Row = ({ label, value }) => (
  <View style={s.row}><Text style={s.rowLabel}>{label}</Text><Text style={s.rowValue}>{value}</Text></View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  photoScroll: { paddingHorizontal: 16, paddingVertical: 16 },
  photo: { width: 200, height: 140, borderRadius: 12, marginRight: 10, backgroundColor: colors.bgLight },
  addPhoto: { width: 120, height: 140, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addText: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '500' },
  card: { backgroundColor: colors.white, marginHorizontal: 16, borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.bgLight },
  rowLabel: { fontSize: 13, color: colors.textSecondary },
  rowValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1, textAlign: 'right' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  secTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  facilityRow: { flexDirection: 'row', flexWrap: 'wrap' },
  editBtn: { backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 20, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  editBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
