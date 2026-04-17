import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';
import FacilityTag from '../../src/components/FacilityTag';
import { FACILITIES_LIST } from '../../src/constants/dummyData';
import { openWhatsApp } from '../../src/services/whatsapp';

const { width } = Dimensions.get('window');

export default function LibraryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { libraries, savedLibraryIds, toggleSaveLibrary } = useApp();
  const lib = libraries.find((l) => l.id === id) || libraries[0];
  const [slotType, setSlotType] = useState('half'); // 'half' | 'full'
  const isSaved = savedLibraryIds.includes(lib.id);
  const isOpen = lib.isOpen24hrs || true;
  const slot = slotType === 'half' ? lib.halfTime : lib.fullTime;
  const facilities = lib.facilities.map((fid) => FACILITIES_LIST.find((f) => f.id === fid)).filter(Boolean);

  return (
    <View style={s.container}>
      {/* Header buttons over image */}
      <View style={s.headerBtns}>
        <TouchableOpacity testID="back-btn" style={s.hBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={s.hBtn} onPress={() => toggleSaveLibrary(lib.id)}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={isSaved ? colors.primary : colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <Image source={{ uri: lib.photos?.[0] }} style={s.heroImage} resizeMode="cover" />

        {/* Info card */}
        <View style={s.infoCard}>
          <Text style={s.libName}>{lib.name}</Text>
          <View style={s.addressRow}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={s.addressText}>{lib.address}</Text>
          </View>

          {/* Open badge */}
          <View style={[s.openBadge, { backgroundColor: isOpen ? colors.success + '18' : colors.danger + '18' }]}>
            <View style={[s.openDot, { backgroundColor: isOpen ? colors.success : colors.danger }]} />
            <Text style={[s.openText, { color: isOpen ? colors.success : colors.danger }]}>
              {isOpen ? `Open Now · ${lib.openTime}` : 'Closed'}
            </Text>
          </View>
        </View>

        {/* Seats section */}
        <View style={s.section}>
          <Text style={s.secTitle}>Seat Availability</Text>
          <View style={s.slotRow}>
            <TouchableOpacity testID="half-time-btn" style={[s.slotBtn, slotType === 'half' && s.slotActive]} onPress={() => setSlotType('half')}>
              <Text style={[s.slotText, slotType === 'half' && s.slotTextActive]}>Half Time</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="full-time-btn" style={[s.slotBtn, slotType === 'full' && s.slotActive]} onPress={() => setSlotType('full')}>
              <Text style={[s.slotText, slotType === 'full' && s.slotTextActive]}>Full Time</Text>
            </TouchableOpacity>
          </View>

          <View style={s.slotCard}>
            <Text style={s.slotTime}>{slot.from} - {slot.to}</Text>
            <Text style={s.slotFee}>₹{slot.fee}/month</Text>
            <View style={[s.seatBadge, { backgroundColor: lib.vacantSeats > 0 ? colors.success + '18' : colors.danger + '18' }]}>
              <Text style={[s.seatBadgeText, { color: lib.vacantSeats > 0 ? colors.success : colors.danger }]}>
                {lib.vacantSeats > 0 ? `${lib.vacantSeats} seats available` : 'Library Full'}
              </Text>
            </View>
          </View>
        </View>

        {/* Facilities */}
        <View style={s.section}>
          <Text style={s.secTitle}>Facilities</Text>
          <View style={s.facilityRow}>
            {facilities.map((f) => <FacilityTag key={f.id} facility={f} />)}
          </View>
        </View>

        {/* Contact */}
        <View style={s.section}>
          <Text style={s.secTitle}>Contact Owner</Text>
          <TouchableOpacity testID="whatsapp-btn" style={s.waBtn} onPress={() => openWhatsApp(lib.whatsapp, lib.name, slotType === 'half' ? 'Half Time' : 'Full Time')}>
            <FontAwesome name="whatsapp" size={22} color={colors.white} />
            <Text style={s.waBtnText}>Chat on WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.saveBtn} onPress={() => toggleSaveLibrary(lib.id)}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primary} />
            <Text style={s.saveBtnText}>{isSaved ? 'Saved' : 'Save Library'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  headerBtns: { position: 'absolute', top: 44, left: 16, right: 16, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
  hBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  heroImage: { width, height: 260, backgroundColor: colors.bgLight },
  infoCard: { backgroundColor: colors.white, marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  libName: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  addressText: { flex: 1, fontSize: 14, color: colors.textSecondary, marginLeft: 6, lineHeight: 20 },
  openBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  openDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  openText: { fontSize: 13, fontWeight: '600' },
  section: { backgroundColor: colors.white, padding: 20, marginTop: 10 },
  secTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
  slotRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  slotBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.cardBorder, alignItems: 'center' },
  slotActive: { borderColor: colors.primary, backgroundColor: colors.lightOrangeBg },
  slotText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  slotTextActive: { color: colors.primary },
  slotCard: { backgroundColor: colors.bgLight, borderRadius: 12, padding: 16, alignItems: 'center' },
  slotTime: { fontSize: 15, color: colors.textSecondary, marginBottom: 4 },
  slotFee: { fontSize: 26, fontWeight: 'bold', color: colors.primary, marginBottom: 10 },
  seatBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  seatBadgeText: { fontSize: 14, fontWeight: '600' },
  facilityRow: { flexDirection: 'row', flexWrap: 'wrap' },
  waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', paddingVertical: 16, borderRadius: 12, marginBottom: 12 },
  waBtnText: { color: colors.white, fontSize: 16, fontWeight: '600', marginLeft: 10 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary, marginLeft: 8 },
});
