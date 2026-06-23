import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';


export default function StudentBookings() {
  const router = useRouter();
  const { libraries, savedLibraryIds, theme: tColors, studentData, currentBookings, currentLibrary } = useApp();
  const saved = libraries.filter((l) => savedLibraryIds.includes(l.id) || savedLibraryIds.includes(l._id));
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'saved'

  // Find if there is an active booking for this student in currentBookings
  const liveBooking = currentBookings?.find(b => {
    // If the booking object directly matches student ID or fallback phone/name matching
    const bStudentId = b.student?._id || b.student?.id || b.student;
    if (bStudentId && studentData?.id && bStudentId === studentData.id) return true;

    const studentPhone = String(b.student?.phone || b.student_phone || '').replace(/\D/g, '').slice(-10);
    const myPhone = String(studentData?.phone || '').replace(/\D/g, '').slice(-10);
    return (studentPhone && studentPhone === myPhone && studentPhone.length === 10) ||
           (studentData?.name && b.student?.name?.toLowerCase() === studentData?.name?.toLowerCase());
  });

  const activeBooking = liveBooking ? {
    libraryName: liveBooking.library?.name || currentLibrary?.name || 'Your Library',
    slot: liveBooking.shift,
    expiryDate: new Date(liveBooking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    seatNo: liveBooking.seat,
    status: liveBooking.status,
    image: liveBooking.library?.photos?.[0] || currentLibrary?.photos?.[0] || libraries[0]?.photos?.[0] || 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80',
    ownerPhone: liveBooking.library?.phone || currentLibrary?.phone || null,
    joinedDate: liveBooking.admissionDate ? new Date(liveBooking.admissionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown',
  } : null;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, backgroundColor: tColors.bg },
    heading: { fontSize: 28, fontWeight: '800', color: tColors.textDark },
    
    tabContainer: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 16 },
    tabBtn: { marginRight: 24, paddingBottom: 8 },
    tabActive: { borderBottomWidth: 3, borderBottomColor: tColors.primary },
    tabText: { fontSize: 16, fontWeight: '600', color: tColors.textGray },
    tabTextActive: { color: tColors.primary, fontWeight: '800' },
    
    scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
    
    /* Ticket Card (Active Booking) */
    ticketCard: { backgroundColor: tColors.cardBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: tColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 16 },
    ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tColors.border, borderStyle: 'dashed' },
    statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: tColors.primary, marginRight: 6 },
    statusText: { color: tColors.primary, fontSize: 12, fontWeight: '700' },
    seatText: { fontSize: 14, fontWeight: '700', color: tColors.textDark },
    
    ticketBody: { flexDirection: 'row', marginTop: 16, marginBottom: 16 },
    ticketImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: tColors.border },
    ticketInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    libName: { fontSize: 16, fontWeight: '800', color: tColors.textDark, marginBottom: 4 },
    slotText: { fontSize: 13, color: tColors.primary, fontWeight: '600', marginBottom: 8 },
    
    dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.bg, padding: 8, borderRadius: 8 },
    dateBox: { flex: 1 },
    dateLabel: { fontSize: 10, color: tColors.textGray, marginBottom: 2 },
    dateValue: { fontSize: 12, fontWeight: '700', color: tColors.textDark },
    dateDivider: { width: 1, height: '80%', backgroundColor: tColors.border, marginHorizontal: 8 },
    
    ticketFooter: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', backgroundColor: tColors.primaryLight, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { color: tColors.primary, fontWeight: '700', fontSize: 14, marginLeft: 6 },
    actionBtnOutline: { flex: 1, borderWidth: 1.5, borderColor: tColors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionBtnOutlineText: { color: tColors.primary, fontWeight: '700', fontSize: 14 },
    
    /* Saved Libraries */
    savedCard: { flexDirection: 'row', backgroundColor: tColors.cardBg, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: tColors.border, marginBottom: 16 },
    savedImg: { width: 90, height: 90, borderRadius: 12, backgroundColor: tColors.border },
    savedInfo: { flex: 1, marginLeft: 14, justifyContent: 'center' },
    savedName: { fontSize: 16, fontWeight: '800', color: tColors.textDark, marginBottom: 6 },
    savedLocation: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    savedLocText: { fontSize: 12, color: tColors.textGray, marginLeft: 4, flex: 1 },
    savedBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ratingBox: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 12, fontWeight: '700', color: tColors.textDark, marginLeft: 4 },
    savedPrice: { fontSize: 15, fontWeight: '800', color: tColors.primary },
    
    /* Empty State */
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: tColors.textDark, marginTop: 16 },
    emptySub: { fontSize: 14, color: tColors.textGray, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
    browseBtn: { backgroundColor: tColors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginTop: 24 },
    browseBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.heading}>My Spaces</Text>
      </View>

      {/* Custom Top Tabs */}
      <View style={s.tabContainer}>
        <TouchableOpacity style={[s.tabBtn, activeTab === 'bookings' && s.tabActive]} onPress={() => setActiveTab('bookings')}>
          <Text style={[s.tabText, activeTab === 'bookings' && s.tabTextActive]}>Active Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, activeTab === 'saved' && s.tabActive]} onPress={() => setActiveTab('saved')}>
          <Text style={[s.tabText, activeTab === 'saved' && s.tabTextActive]}>Saved ({saved.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 10 }}>
        
        {activeTab === 'bookings' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* ACTIVE BOOKINGS VIEW */}
            {!activeBooking ? (
              <View style={s.empty}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text style={s.emptyTitle}>No active bookings</Text>
                <Text style={s.emptySub}>Aapka koi active seat booking nahi mila. Apne library owner se booking add karne ko kahein ya new library explore karein.</Text>
                <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/student/tabs/home')}>
                  <Text style={s.browseBtnText}>Explore Libraries</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={s.ticketCard}>
                <View style={s.ticketHeader}>
                  <View style={s.statusPill}>
                    <View style={s.statusDot} />
                    <Text style={s.statusText}>{activeBooking.status}</Text>
                  </View>
                  <Text style={s.seatText}>Seat: {activeBooking.seatNo}</Text>
                </View>
                
                <View style={s.ticketBody}>
                  <Image source={{ uri: activeBooking.image }} style={s.ticketImage} />
                  <View style={s.ticketInfo}>
                    <Text style={s.libName} numberOfLines={1}>{activeBooking.libraryName}</Text>
                    <Text style={s.slotText}>{activeBooking.slot}</Text>
                    
                    <View style={s.dateRow}>
                      <View style={s.dateBox}>
                        <Text style={s.dateLabel}>Joined On</Text>
                        <Text style={s.dateValue}>{activeBooking.joinedDate}</Text>
                      </View>
                      <View style={s.dateDivider} />
                      <View style={s.dateBox}>
                        <Text style={s.dateLabel}>Expires On</Text>
                        <Text style={[s.dateValue, { color: '#DC2626' }]}>{activeBooking.expiryDate}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={s.ticketFooter}>
                  <TouchableOpacity 
                    style={s.actionBtn}
                    onPress={() => {
                      Alert.alert(
                        'Fee Receipt 📄',
                        `LibConnect - Official Slip\n\nLibrary: ${activeBooking.libraryName}\nSeat: ${activeBooking.seatNo}\nShift: ${activeBooking.slot}\nStatus: ${activeBooking.status}\nExpiry: ${activeBooking.expiryDate}\n\nThank you for choosing our library!`,
                        [{ text: 'Close', style: 'cancel' }]
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="document-text-outline" size={16} color={tColors.primary} />
                    <Text style={s.actionBtnText}>Fee Receipt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={s.actionBtnOutline}
                    onPress={() => {
                      if (!activeBooking.ownerPhone) {
                        Alert.alert('Unavailable', 'Owner contact number is not available.');
                        return;
                      }
                      const rawOwnerPhone = String(activeBooking.ownerPhone).replace(/\D/g, '').replace(/^0+/, '').replace(/^91/, '');
                      Linking.openURL(`https://wa.me/91${rawOwnerPhone}?text=${encodeURIComponent('Hi, I need help with my seat booking.')}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubbles-outline" size={16} color={tColors.primary} />
                    <Text style={s.actionBtnOutlineText}>Message Owner</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            )}
          </ScrollView>
        ) : (
          /* SAVED LIBRARIES VIEW */
          saved.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="bookmark-outline" size={64} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No saved libraries yet</Text>
              <Text style={s.emptySub}>Tap the bookmark icon to save your favorite spaces.</Text>
              <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/student/tabs/home')}>
                <Text style={s.browseBtnText}>Explore Libraries</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={saved}
              keyExtractor={(item) => item.id || item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item: lib }) => (
                <TouchableOpacity 
                  style={s.savedCard} 
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/student/library-detail', params: { id: lib.id || lib._id } })}
                >
                  <Image source={{ uri: lib.photos?.[0] }} style={s.savedImg} />
                  <View style={s.savedInfo}>
                    <Text style={s.savedName} numberOfLines={1}>{lib.name}</Text>
                    <View style={s.savedLocation}>
                      <Ionicons name="location-outline" size={12} color={tColors.textGray} />
                      <Text style={s.savedLocText} numberOfLines={1}>{lib.address}</Text>
                    </View>
                    <View style={s.savedBottom}>
                      <View style={s.ratingBox}>
                        <Ionicons name="star" size={12} color="#F5A623" />
                        <Text style={s.ratingText}>{lib.rating || '4.5'}</Text>
                      </View>
                      <Text style={s.savedPrice}>₹{lib.halfTime?.fee || 400}/mo</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        )}
      </View>
    </View>
  );
}


