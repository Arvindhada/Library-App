import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
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
  const { libraries, savedLibraryIds, toggleSaveLibrary, bookLibrarySpace, getPublicSeats, theme: tColors } = useApp();
  const lib = libraries.find((l) => l.id === id || l._id === id) || libraries[0];
  const [slotType, setSlotType] = useState('morning');
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const isSaved = savedLibraryIds.includes(lib.id);
  const isOpen = lib.isOpen24hrs || true;
  const slot = slotType === 'full' ? lib.fullTime : lib.halfTime;
  const facilities = lib.facilities.map((fid) => FACILITIES_LIST.find((f) => f.id === fid)).filter(Boolean);

  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    const fetchSeats = async () => {
      if (lib && (lib._id || lib.id)) {
        const seats = await getPublicSeats(lib._id || lib.id);
        setOccupiedSeats(seats || []);
      }
    };
    fetchSeats();
  }, [lib]);

  const handleBookSeat = async () => {
    if (!selectedSeat) {
      Alert.alert('Select Seat', 'Kripya seat book karne se pehle niche grid me se koi bhi ek khali seat select karein!');
      return;
    }
    setBookingLoading(true);
    try {
      const shiftName = slotType === 'full' ? 'Full Time' : (slotType === 'morning' ? 'Morning' : 'Evening');
      await bookLibrarySpace(lib._id || lib.id, shiftName, selectedSeat);
      
      const ownerNumber = lib.whatsapp || lib.phone;
      if (ownerNumber) {
        Alert.alert(
          'Request Sent! 🚀',
          `Aapki seat number ${selectedSeat} ki booking request database me save ho gayi hai. Chalo ab WhatsApp par owner ko message karke seat final karte hain!`,
          [
            {
              text: 'Open WhatsApp',
              onPress: () => openWhatsApp(ownerNumber, lib.name, `${shiftName} (Seat ${selectedSeat})`)
            }
          ]
        );
      } else {
        Alert.alert(
          'Request Sent! 🚀',
          `Aapki seat number ${selectedSeat} ki booking request database me save ho gayi hai. Owner contact number is currently unavailable.`
        );
      }
    } catch (e) {
      Alert.alert(
        'Booking Request Failed',
        e.response?.data?.message || e.message || 'Back-end connectivity error.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  let openTimeStr = '6 AM';
  let closeTimeStr = '10 PM';
  let morningSlotStr = '6 AM - 2 PM';
  let eveningSlotStr = '2 PM - 10 PM';
  let fullTimeSlotStr = '6 AM - 10 PM';

  if (lib.timings) {
    const parts = lib.timings.split(' to ');
    let parsedOk = false;
    if (parts.length === 2) {
      openTimeStr = parts[0].trim();
      closeTimeStr = parts[1].trim();
      parsedOk = true;
    } else {
      const partsHyphen = lib.timings.split('–');
      if (partsHyphen.length === 2) {
        openTimeStr = partsHyphen[0].trim();
        closeTimeStr = partsHyphen[1].trim();
        parsedOk = true;
      }
    }

    if (parsedOk) {
      const parseTime = (str) => {
        const match = str.match(/^(\d+)(?::(\d+))?\s*(AM|PM)$/i);
        if (!match) return null;
        let h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return h + m / 60;
      };

      const formatTime = (num) => {
        const h = Math.floor(num);
        const m = Math.round((num - h) * 60);
        const ampm = h >= 12 ? 'PM' : 'AM';
        let dh = h % 12;
        if (dh === 0) dh = 12;
        const dm = m > 0 ? `:${m.toString().padStart(2, '0')}` : '';
        return `${dh}${dm} ${ampm}`;
      };

      const openVal = parseTime(openTimeStr);
      const closeVal = parseTime(closeTimeStr);

      if (openVal !== null && closeVal !== null) {
        let duration = closeVal - openVal;
        if (duration < 0) duration += 24; // overnight
        const midVal = (openVal + duration / 2) % 24;
        morningSlotStr = `${openTimeStr} - ${formatTime(midVal)}`;
        eveningSlotStr = `${formatTime(midVal)} - ${closeTimeStr}`;
        fullTimeSlotStr = `${openTimeStr} - ${closeTimeStr}`;
      } else {
        fullTimeSlotStr = lib.timings;
      }
    } else {
      fullTimeSlotStr = lib.timings;
    }
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80';

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activePhotoIndex) {
      setActivePhotoIndex(slide);
    }
  };

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
      <View style={s.headerBtns}>
        <TouchableOpacity style={s.hBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={tColors.textDark} />
        </TouchableOpacity>
        <TouchableOpacity style={s.hBtn} onPress={() => toggleSaveLibrary(lib.id)} activeOpacity={0.8}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={isSaved ? tColors.primary : tColors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ position: 'relative' }}>
          {lib.photos && lib.photos.length > 0 ? (
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {lib.photos.map((photoUri, index) => (
                <TouchableOpacity key={index} activeOpacity={0.9} onPress={() => setIsImageViewVisible(true)}>
                  <Image source={{ uri: photoUri }} style={s.heroImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setIsImageViewVisible(true)}>
              <Image source={{ uri: fallbackImage }} style={s.heroImage} resizeMode="cover" />
            </TouchableOpacity>
          )}
          
          {lib.photos && lib.photos.length > 1 && (
            <View style={{
              position: 'absolute',
              bottom: 40,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 5
            }}>
              {lib.photos.map((_, idx) => (
                <View 
                  key={idx}
                  style={{
                    width: idx === activePhotoIndex ? 10 : 6,
                    height: idx === activePhotoIndex ? 10 : 6,
                    borderRadius: 5,
                    backgroundColor: idx === activePhotoIndex ? tColors.primary : 'rgba(255,255,255,0.7)',
                    marginHorizontal: 4,
                  }}
                />
              ))}
            </View>
          )}
        </View>

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

          <Text style={s.secTitle}>Select Time Slot</Text>
          <View style={s.slotRow}>
            <TouchableOpacity style={[s.slotBtn, slotType === 'morning' && s.slotActive]} onPress={() => setSlotType('morning')} activeOpacity={0.8}>
              <Text style={[s.slotText, slotType === 'morning' && s.slotTextActive]}>Morning</Text>
              <Text style={[s.slotSubText, slotType === 'morning' && s.slotSubTextActive]}>{morningSlotStr}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.slotBtn, slotType === 'evening' && s.slotActive]} onPress={() => setSlotType('evening')} activeOpacity={0.8}>
              <Text style={[s.slotText, slotType === 'evening' && s.slotTextActive]}>Evening</Text>
              <Text style={[s.slotSubText, slotType === 'evening' && s.slotSubTextActive]}>{eveningSlotStr}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.slotBtn, slotType === 'full' && s.slotActive]} onPress={() => setSlotType('full')} activeOpacity={0.8}>
              <Text style={[s.slotText, slotType === 'full' && s.slotTextActive]}>Full Time</Text>
              <Text style={[s.slotSubText, slotType === 'full' && s.slotSubTextActive]}>{fullTimeSlotStr}</Text>
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

          <Text style={s.secTitle}>Select Seat</Text>
          
          {/* Seat Stats Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: tColors.primaryLight, padding: 10, borderRadius: 12, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: tColors.primary + '20' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: tColors.primary }}>{lib.totalSeats - occupiedSeats.length > 0 ? lib.totalSeats - occupiedSeats.length : 0}</Text>
              <Text style={{ fontSize: 11, color: tColors.textGray, marginTop: 2 }}>Available</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#6B7280' }}>{occupiedSeats.length}</Text>
              <Text style={{ fontSize: 11, color: tColors.textGray, marginTop: 2 }}>Occupied</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FFF3E8', padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FDDCBB' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#C2410C' }}>{lib.totalSeats || lib.total_seats || 40}</Text>
              <Text style={{ fontSize: 11, color: tColors.textGray, marginTop: 2 }}>Total Seats</Text>
            </View>
          </View>

          {/* Scrollable Grid Container */}
          <View style={{ height: 210, borderWidth: 1, borderColor: tColors.border, borderRadius: 16, backgroundColor: tColors.cardBg, padding: 12, marginBottom: 12 }}>
            <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {Array.from({ length: lib.totalSeats || lib.total_seats || 40 }).map((_, index) => {
                const seatNum = index + 1;
                const isOccupied = occupiedSeats.includes(seatNum);
                const isSelected = selectedSeat === seatNum;
                
                return (
                  <TouchableOpacity
                    key={seatNum}
                    disabled={isOccupied}
                    onPress={() => setSelectedSeat(isSelected ? null : seatNum)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: isOccupied 
                        ? '#E5E7EB' 
                        : (isSelected ? tColors.primary : tColors.border),
                      backgroundColor: isOccupied 
                        ? '#F3F4F6' 
                        : (isSelected ? tColors.primaryLight : tColors.cardBg),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: isOccupied 
                        ? '#9CA3AF' 
                        : (isSelected ? tColors.primary : tColors.textDark),
                    }}>
                      {seatNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, borderWidth: 1, borderColor: tColors.border, backgroundColor: tColors.cardBg }} />
              <Text style={{ fontSize: 11, color: tColors.textGray, fontWeight: '500' }}>Available</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: tColors.primaryLight, borderWidth: 1.5, borderColor: tColors.primary }} />
              <Text style={{ fontSize: 11, color: tColors.textGray, fontWeight: '500' }}>Selected</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }} />
              <Text style={{ fontSize: 11, color: tColors.textGray, fontWeight: '500' }}>Occupied</Text>
            </View>
          </View>

          <View style={s.divider} />

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

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={s.stickyBottomBar}>
        <View style={s.bottomBarPriceBox}>
          <Text style={s.bottomBarPriceLabel}>Monthly Fee</Text>
          <Text style={s.bottomBarPriceValue}>₹{slot.fee}</Text>
        </View>
        <TouchableOpacity 
          style={s.stickyBtn} 
          onPress={handleBookSeat} 
          activeOpacity={0.9}
          disabled={bookingLoading}
        >
          {bookingLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={s.stickyBtnText}>Book Space</Text>
          )}
        </TouchableOpacity>
      </View>

      <ImageViewing
        images={(lib.photos && lib.photos.length > 0) ? lib.photos.map(p => ({ uri: p })) : [{ uri: fallbackImage }]}
        imageIndex={activePhotoIndex}
        visible={isImageViewVisible}
        onRequestClose={() => setIsImageViewVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
    </View>
  );
}


