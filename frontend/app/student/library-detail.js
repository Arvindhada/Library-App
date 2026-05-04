import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';
import { useApp } from '../../src/context/AppContext';
import { FACILITIES_LIST } from '../../src/constants/dummyData';
import { openWhatsApp } from '../../src/services/whatsapp';

const { width } = Dimensions.get('window');



export default function LibraryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { libraries, savedLibraryIds, toggleSaveLibrary, theme: tColors } = useApp();
  const lib = libraries.find((l) => l.id === id) || libraries[0];
  const [slotType, setSlotType] = useState('morning');
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const isSaved = savedLibraryIds.includes(lib.id);
  const isOpen = lib.isOpen24hrs || true;
  const slot = slotType === 'full' ? lib.fullTime : lib.halfTime;
  const facilities = lib.facilities.map((fid) => FACILITIES_LIST.find((f) => f.id === fid)).filter(Boolean);

  const fallbackImage = 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80';

  const openMap = () => {
    const destination = encodeURIComponent(lib.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(url);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    headerBtns: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
    hBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: tColors.cardBg, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    heroImage: { width, height: 320, backgroundColor: tColors.border },
    
    infoContent: { backgroundColor: tColors.bg, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
    
    libName: { fontSize: 26, fontWeight: '800', color: tColors.textDark, marginBottom: 10 },
    locationWrapper: { marginBottom: 20 },
    locationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    addressText: { flex: 1, fontSize: 14, color: tColors.textGray, marginLeft: 6, lineHeight: 20 },
    mapLinkBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 22, alignSelf: 'flex-start' },
    mapLinkText: { color: tColors.primary, fontSize: 13, fontWeight: '700', marginLeft: 4, textDecorationLine: 'underline' },
    
    ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.cardBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: tColors.border },
    ratingText: { fontSize: 14, fontWeight: '700', color: tColors.textDark, marginLeft: 6 },
    reviewsText: { fontSize: 12, color: tColors.textGray, marginLeft: 4 },
    openBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    openText: { fontSize: 12, fontWeight: '700' },
    
    divider: { height: 1, backgroundColor: tColors.border, marginVertical: 24 },
    
    secTitle: { fontSize: 18, fontWeight: '700', color: tColors.textDark, marginBottom: 16 },
    
    slotRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    slotBtn: { flex: 1, paddingVertical: 18, paddingHorizontal: 4, borderRadius: 16, borderWidth: 1.5, borderColor: tColors.border, backgroundColor: tColors.cardBg, alignItems: 'center', justifyContent: 'center' },
    slotActive: { borderColor: tColors.primary, backgroundColor: tColors.primaryLight },
    slotText: { fontSize: 14, fontWeight: '800', color: tColors.textDark, marginBottom: 4 },
    slotTextActive: { color: tColors.primary },
    slotSubText: { fontSize: 11, fontWeight: '600', color: tColors.textGray, textAlign: 'center' },
    slotSubTextActive: { color: tColors.primary },
    
    priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: tColors.cardBg, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: tColors.border },
    priceLabel: { fontSize: 13, color: tColors.textGray, marginBottom: 4 },
    priceValue: { fontSize: 28, fontWeight: '800', color: tColors.textDark },
    seatPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    seatPillText: { fontSize: 14, fontWeight: '700' },
    
    facilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    facilityTag: { flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 8 },
    facilityIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: tColors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    facilityText: { fontSize: 14, color: tColors.textDark, fontWeight: '500' },
    
    stickyBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: tColors.cardBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: tColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
    bottomBarPriceBox: { flex: 1 },
    bottomBarPriceLabel: { fontSize: 12, color: tColors.textGray },
    bottomBarPriceValue: { fontSize: 22, fontWeight: '800', color: tColors.textDark },
    stickyBtn: { backgroundColor: tColors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, shadowColor: tColors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    stickyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  });

  return (
    <View style={s.container}>
      {/* Header buttons over image */}
      <View style={s.headerBtns}>
        <TouchableOpacity style={s.hBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={tColors.textDark} />
        </TouchableOpacity>
        <TouchableOpacity style={s.hBtn} onPress={() => toggleSaveLibrary(lib.id)} activeOpacity={0.8}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={isSaved ? tColors.primary : tColors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => setIsImageViewVisible(true)}>
          <Image source={{ uri: lib.photos?.[0] || fallbackImage }} style={s.heroImage} resizeMode="cover" />
        </TouchableOpacity>

        {/* Info Content */}
        <View style={s.infoContent}>
          <Text style={s.libName}>{lib.name}</Text>

          <View style={s.locationWrapper}>
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={16} color={tColors.textGray} style={{ marginTop: 2 }} />
              <Text style={s.addressText}>{lib.address}</Text>
            </View>
            <TouchableOpacity style={s.mapLinkBtn} onPress={openMap}>
              <Ionicons name="map-outline" size={14} color={tColors.primary} />
              <Text style={s.mapLinkText}>View on map</Text>
            </TouchableOpacity>
          </View>

          <View style={s.ratingRow}>
            <View style={s.ratingPill}>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text style={s.ratingText}>{lib.rating || 4.5}</Text>
              <Text style={s.reviewsText}>({(lib.rating * 28).toFixed(0)} reviews)</Text>
            </View>
            <View style={[s.openBadge, { backgroundColor: isOpen ? '#E8F5E9' : '#FEE2E2' }]}>
              <Text style={[s.openText, { color: isOpen ? tColors.primary : '#DC2626' }]}>
                {isOpen ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* Seat & Slot Section */}
          <Text style={s.secTitle}>Select Time Slot</Text>
          <View style={s.slotRow}>
            <TouchableOpacity style={[s.slotBtn, slotType === 'morning' && s.slotActive]} onPress={() => setSlotType('morning')} activeOpacity={0.8}>
              <Text style={[s.slotText, slotType === 'morning' && s.slotTextActive]}>Morning</Text>
              <Text style={[s.slotSubText, slotType === 'morning' && s.slotSubTextActive]}>6 AM-2 PM</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.slotBtn, slotType === 'evening' && s.slotActive]} onPress={() => setSlotType('evening')} activeOpacity={0.8}>
              <Text style={[s.slotText, slotType === 'evening' && s.slotTextActive]}>Evening</Text>
              <Text style={[s.slotSubText, slotType === 'evening' && s.slotSubTextActive]}>2 PM-10 PM</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.slotBtn, slotType === 'full' && s.slotActive]} onPress={() => setSlotType('full')} activeOpacity={0.8}>
              <Text style={[s.slotText, slotType === 'full' && s.slotTextActive]}>Full Time</Text>
              <Text style={[s.slotSubText, slotType === 'full' && s.slotSubTextActive]}>6 AM-10 PM</Text>
            </TouchableOpacity>
          </View>

          <View style={s.priceCard}>
            <View>
              <Text style={s.priceLabel}>Monthly Fee</Text>
              <Text style={s.priceValue}>₹{slot.fee}</Text>
            </View>
            <View style={[s.seatPill, { backgroundColor: lib.vacantSeats > 0 ? tColors.primaryLight : '#FEE2E2' }]}>
              <Text style={[s.seatPillText, { color: lib.vacantSeats > 0 ? tColors.primary : '#DC2626' }]}>
                {lib.vacantSeats > 0 ? `${lib.vacantSeats} seats free` : 'Full'}
              </Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* Facilities */}
          <Text style={s.secTitle}>Facilities</Text>
          <View style={s.facilityGrid}>
            {facilities.map((f, i) => {
              const Icon = f.lib === 'Ionicons' ? Ionicons : f.lib === 'MaterialIcons' ? MaterialIcons : FontAwesome;
              return (
                <View key={i} style={s.facilityTag}>
                  <View style={s.facilityIconBox}>
                    <Icon name={f.icon} size={16} color={tColors.primary} />
                  </View>
                  <Text style={s.facilityText}>{f.name}</Text>
                </View>
              );
            })}
          </View>

          <View style={{ height: 100 }} /> {/* Extra padding for sticky bottom bar */}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={s.stickyBottomBar}>
        <View style={s.bottomBarPriceBox}>
          <Text style={s.bottomBarPriceLabel}>Monthly Fee</Text>
          <Text style={s.bottomBarPriceValue}>₹{slot.fee}</Text>
        </View>
        <TouchableOpacity style={s.stickyBtn} onPress={() => openWhatsApp(lib.whatsapp, lib.name, slotType === 'full' ? 'Full Time' : (slotType === 'morning' ? 'Morning Slot' : 'Evening Slot'))} activeOpacity={0.9}>
          <Text style={s.stickyBtnText}>Book Space</Text>
        </TouchableOpacity>
      </View>

      <ImageViewing
        images={[{ uri: lib.photos?.[0] || fallbackImage }]}
        imageIndex={0}
        visible={isImageViewVisible}
        onRequestClose={() => setIsImageViewVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
    </View>
  );
}


