import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Linking, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
// import ImageViewing from 'react-native-image-viewing';
import { useApp } from '../../src/context/AppContext';
import { FACILITIES_LIST } from '../../src/constants/dummyData';
import { openWhatsApp } from '../../src/services/whatsapp';

const { width } = Dimensions.get('window');



export default function LibraryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { libraries, savedLibraryIds, toggleSaveLibrary, theme: tColors, fetchLibraries } = useApp();
  const lib = libraries.find((l) => l.id === id) || (libraries.length > 0 ? libraries[0] : null);
  const [slotType, setSlotType] = useState('morning');
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [occupancy, setOccupancy] = useState({});
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showCustomAlert = (title, message, buttons) => {
    setAlertConfig({ visible: true, title, message, buttons: buttons || [{ text: 'OK', onPress: () => closeCustomAlert() }] });
  };
  const closeCustomAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  React.useEffect(() => {
    if (!lib && libraries.length === 0) {
      fetchLibraries();
    }
    if (lib) {
      fetchOccupancy();
    }
  }, [lib, libraries.length]);

  const fetchOccupancy = async () => {
    setLoadingSeats(true);
    try {
      const { API_ENDPOINTS } = require('../../src/services/apiConfig');
      const axios = require('axios').default;
      const res = await axios.get(`${API_ENDPOINTS.LIBRARIES}/${lib.id || lib._id}/seats`);
      if (res.data?.success) {
        setOccupancy(res.data.occupancy || {});
      }
    } catch (e) {
      console.warn('Fetch occupancy failed:', e.message);
    } finally {
      setLoadingSeats(false);
    }
  };

  if (!lib) {
    return (
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: tColors.bg }]}>
        <ActivityIndicator size="large" color={tColors.primary} />
      </View>
    );
  }

  const isSaved = savedLibraryIds.includes(lib.id);
  const isOpen = lib.isOpen24hrs || true;
  const slotFee = slotType === 'full' ? (lib.full_time_fee || lib.fullTime?.fee || 1000) : (lib.half_time_fee || lib.halfTime?.fee || 500);
  const facilities = (lib.facilities || []).map((fid) => FACILITIES_LIST.find((f) => f.id === fid)).filter(Boolean);

  const fallbackImage = 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80';

  const openMap = () => {
    const destination = encodeURIComponent(lib.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(url);
  };

  const { requestBooking, loading: bookingLoading, currentBookings } = useApp();

  const handleBook = async () => {
    const hasExisting = (currentBookings || []).some(b => b.status === 'Active' || b.status === 'Pending');
    if (hasExisting) {
      const msg = 'Aapke paas pehle se hi ek active ya pending seat hai. Aap ek waqt mein sirf ek hi seat book kar sakte hain.';
      showCustomAlert('Booking Exists', msg);
      return;
    }

    if (lib.vacantSeats <= 0) {
      const msg = 'Sorry, no seats are currently available.';
      showCustomAlert('Full', msg);
      return;
    }

    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 1);

    const bookingData = {
      libraryId: String(lib._id || lib.id),
      startDate: today.toISOString(),
      endDate: endDate.toISOString(),
      shift: slotType === 'full' ? 'Full Day' : (slotType === 'morning' ? 'Morning' : 'Evening'),
    };
    
    if (selectedSeat) {
      bookingData.seat = selectedSeat;
    }

    const result = await requestBooking(bookingData);
    if (result.success) {
      const msg = 'Your booking request is pending owner approval. Would you like to message the owner on WhatsApp for faster confirmation?';
      
      showCustomAlert(
        'Request Sent!',
        msg,
        [
          { text: 'Later', style: 'cancel', onPress: () => closeCustomAlert() },
          { 
            text: 'WhatsApp', 
            onPress: () => {
              closeCustomAlert();
              openWhatsApp(lib.whatsapp, lib.name, slotType === 'full' ? 'Full Time' : (slotType === 'morning' ? 'Morning Slot' : 'Evening Slot'));
            }
          }
        ]
      );
    } else {
      showCustomAlert('Error', result.message);
    }
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

    // Process Card
    processCard: { backgroundColor: tColors.primaryLight, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: tColors.primary + '20' },
    processStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 14 },
    stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: tColors.primary, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    stepNumberText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    stepInfo: { flex: 1 },
    stepTitle: { fontSize: 15, fontWeight: '700', color: tColors.textDark, marginBottom: 2 },
    stepDesc: { fontSize: 13, color: tColors.textGray, lineHeight: 18 },

    // Seat Map Styles
    legendRow: { flexDirection: 'row', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 12, height: 12, borderRadius: 3 },
    legendText: { fontSize: 12, color: tColors.textGray, fontWeight: '600' },
    seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    seat: { width: 44, height: 44, borderRadius: 10, backgroundColor: tColors.primaryLight, borderWidth: 1, borderColor: tColors.primary, justifyContent: 'center', alignItems: 'center' },
    seatText: { fontSize: 14, fontWeight: '700', color: tColors.primary },
    seatOccupied: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
    seatSelected: { backgroundColor: '#FFB300', borderColor: '#FFB300' },
    
    // Custom Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '80%', maxWidth: 400, backgroundColor: tColors.cardBg, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 10 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: tColors.textDark, marginBottom: 12, textAlign: 'center' },
    modalMessage: { fontSize: 15, color: tColors.textGray, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 12 },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    modalButtonCancel: { backgroundColor: tColors.border },
    modalButtonConfirm: { backgroundColor: tColors.primary },
    modalButtonText: { fontSize: 15, fontWeight: '700' },
    modalButtonTextCancel: { color: tColors.textDark },
    modalButtonTextConfirm: { color: '#FFF' },
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
              <Text style={s.priceValue}>₹{slotFee}</Text>
            </View>
            <View style={[s.seatPill, { backgroundColor: lib.vacantSeats > 0 ? tColors.primaryLight : '#FEE2E2' }]}>
              <Text style={[s.seatPillText, { color: lib.vacantSeats > 0 ? tColors.primary : '#DC2626' }]}>
                {lib.vacantSeats > 0 ? `${lib.vacantSeats} seats free` : 'Full'}
              </Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* LIVE SEAT MAP */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={s.secTitle}>Live Seat Map</Text>
            <TouchableOpacity onPress={fetchOccupancy} style={{ padding: 4 }}>
              <Ionicons name="refresh" size={18} color={tColors.primary} />
            </TouchableOpacity>
          </View>

          <View style={s.legendRow}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: tColors.primaryLight, borderWidth: 1, borderColor: tColors.primary }]} />
              <Text style={s.legendText}>Available</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#DC2626' }]} />
              <Text style={s.legendText}>Occupied</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#FFB300' }]} />
              <Text style={s.legendText}>Selected</Text>
            </View>
          </View>

          {loadingSeats ? (
            <ActivityIndicator size="small" color={tColors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View style={s.seatGrid}>
              {Array.from({ length: lib.total_seats || 50 }, (_, i) => {
                const seatNum = String(i + 1);
                const shifts = occupancy[seatNum] || [];
                const currentShift = slotType === 'full' ? 'Full Day' : (slotType === 'morning' ? 'Morning' : 'Evening');
                
                // Seat is occupied if it has 'Full Day' OR the current shift
                const isOccupied = shifts.includes('Full Day') || shifts.includes(currentShift) || (currentShift === 'Full Day' && shifts.length > 0);
                const isSelected = selectedSeat === seatNum;

                return (
                  <TouchableOpacity
                    key={i}
                    disabled={isOccupied}
                    onPress={() => setSelectedSeat(isSelected ? null : seatNum)}
                    style={[
                      s.seat,
                      isOccupied && s.seatOccupied,
                      isSelected && s.seatSelected
                    ]}
                  >
                    <Text style={[s.seatText, (isOccupied || isSelected) && { color: '#FFF' }]}>{seatNum}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={s.divider} />

          {/* Booking Process Explanation */}
          <View style={s.processCard}>
            <Text style={s.secTitle}>How Booking Works</Text>
            <View style={s.processStep}>
              <View style={s.stepNumber}><Text style={s.stepNumberText}>1</Text></View>
              <View style={s.stepInfo}>
                <Text style={s.stepTitle}>Pick a Seat</Text>
                <Text style={s.stepDesc}>Select an available seat from the live map above.</Text>
              </View>
            </View>
            <View style={s.processStep}>
              <View style={s.stepNumber}><Text style={s.stepNumberText}>2</Text></View>
              <View style={s.stepInfo}>
                <Text style={s.stepTitle}>Wait for Approval</Text>
                <Text style={s.stepDesc}>The owner will review your request and check availability.</Text>
              </View>
            </View>
            <View style={s.processStep}>
              <View style={[s.stepNumber, { backgroundColor: '#FFB300' }]}><Text style={s.stepNumberText}>3</Text></View>
              <View style={s.stepInfo}>
                <Text style={s.stepTitle}>Pay to Confirm</Text>
                <Text style={s.stepDesc}>Once approved, you can pay the owner via UPI/Cash to finalize your seat.</Text>
              </View>
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

          <View style={s.divider} />

          {/* WhatsApp Contact Section */}

          <Text style={s.secTitle}>Questions?</Text>
          <TouchableOpacity 
            style={[s.priceCard, { borderColor: '#25D366', backgroundColor: '#F0FFF4' }]} 
            onPress={() => openWhatsApp(lib.whatsapp, lib.name, 'General Query')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' }}>
                <FontAwesome name="whatsapp" size={24} color="#FFF" />
              </View>
              <View>
                <Text style={[s.secTitle, { marginBottom: 2, fontSize: 16 }]}>Chat with Owner</Text>
                <Text style={s.stepDesc}>Ask about seats, timing or facilities</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={tColors.textGray} />
          </TouchableOpacity>

          <View style={{ height: 100 }} /> {/* Extra padding for sticky bottom bar */}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={s.stickyBottomBar}>
        <View style={s.bottomBarPriceBox}>
          <Text style={s.bottomBarPriceLabel}>Monthly Fee</Text>
          <Text style={s.bottomBarPriceValue}>₹{slotFee}</Text>
        </View>
        <TouchableOpacity 
          style={[s.stickyBtn, (lib.vacantSeats <= 0 || bookingLoading) && { opacity: 0.6 }]} 
          onPress={handleBook} 
          disabled={lib.vacantSeats <= 0 || bookingLoading}
          activeOpacity={0.9}
        >
          {bookingLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={s.stickyBtnText}>Book Space</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Alert Modal */}
      <Modal
        visible={alertConfig.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCustomAlert}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>{alertConfig.title}</Text>
            <Text style={s.modalMessage}>{alertConfig.message}</Text>
            <View style={s.modalButtonContainer}>
              {alertConfig.buttons.map((btn, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[s.modalButton, btn.text === 'Later' || btn.style === 'cancel' ? s.modalButtonCancel : s.modalButtonConfirm]}
                  onPress={btn.onPress || closeCustomAlert}
                >
                  <Text style={[s.modalButtonText, btn.text === 'Later' || btn.style === 'cancel' ? s.modalButtonTextCancel : s.modalButtonTextConfirm]}>{btn.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}


