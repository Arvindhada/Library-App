import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';
import { openWhatsAppToOwner } from '../../../src/services/whatsapp';

export default function StudentBookings() {
  const router = useRouter();
  const { libraries, savedLibraryIds, currentBookings, studentData, theme: tColors } = useApp();
  const saved = libraries.filter((l) => savedLibraryIds.includes(l.id));
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'saved'
  
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

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
    
    /* Receipt Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    receiptCard: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden' },
    receiptHeader: { backgroundColor: tColors.primary, padding: 24, alignItems: 'center' },
    receiptLibName: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 10 },
    receiptTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    
    receiptBody: { padding: 24 },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    receiptLabel: { fontSize: 13, color: tColors.textGray, fontWeight: '600' },
    receiptValue: { fontSize: 14, color: tColors.textDark, fontWeight: '700' },
    divider: { height: 1, backgroundColor: tColors.border, marginVertical: 16, borderStyle: 'dashed' },
    
    totalSection: { backgroundColor: tColors.bg, padding: 16, borderRadius: 16, marginTop: 8 },
    totalLabel: { fontSize: 14, color: tColors.textDark, fontWeight: '800' },
    totalAmount: { fontSize: 24, color: tColors.primary, fontWeight: '900' },
    
    footerNote: { fontSize: 11, color: tColors.textGray, textAlign: 'center', marginTop: 24, fontStyle: 'italic' },
    closeBtn: { backgroundColor: tColors.textDark, paddingVertical: 16, alignItems: 'center' },
    closeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

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

  const handleFeeReceipt = (booking) => {
    setSelectedBooking(booking);
    setReceiptVisible(true);
  };

  const handleMessageOwner = (booking) => {
    const phone = booking.library?.whatsapp;
    console.log('[Debug] Messaging Owner. Phone:', phone);
    
    if (phone) {
      openWhatsAppToOwner(
        phone, 
        booking.library.name, 
        studentData?.name || 'Student',
        { seat: booking.seat, shift: booking.shift }
      );
    } else {
      Alert.alert(
        'Number Missing', 
        'Owner ne apna WhatsApp number register nahi kiya hai. Unse direct contact karein.'
      );
    }
  };

  const ReceiptModal = () => (
    <Modal visible={receiptVisible} transparent animationType="fade">
      <View style={s.modalOverlay}>
        <View style={s.receiptCard}>
          <View style={s.receiptHeader}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
              <Ionicons name="library" size={32} color="#FFF" />
            </View>
            <Text style={s.receiptLibName}>{selectedBooking?.library?.name}</Text>
            <Text style={s.receiptTitle}>Fee Receipt</Text>
          </View>
          
          <View style={s.receiptBody}>
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>Receipt No.</Text>
              <Text style={s.receiptValue}>#RW-{selectedBooking?._id?.substring(0, 6).toUpperCase() || '000000'}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>Student Name</Text>
              <Text style={s.receiptValue}>{studentData?.name || 'Student'}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>Seat Number</Text>
              <Text style={s.receiptValue}>{selectedBooking?.seat ? `Seat ${selectedBooking.seat}` : 'Not Assigned'}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>Shift</Text>
              <Text style={s.receiptValue}>{selectedBooking?.shift || 'Full Day'}</Text>
            </View>
            
            <View style={s.divider} />
            
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>Start Date</Text>
              <Text style={s.receiptValue}>{selectedBooking?.startDate ? new Date(selectedBooking.startDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>End Date</Text>
              <Text style={s.receiptValue}>{selectedBooking?.endDate ? new Date(selectedBooking.endDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
            
            <View style={s.totalSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.totalLabel}>Total Amount Paid</Text>
                <Text style={s.totalAmount}>₹{selectedBooking?.amount || 0}</Text>
              </View>
            </View>
            
            <Text style={s.footerNote}>This is an electronically generated receipt by LibraryWala. No signature required.</Text>
          </View>
          
          <TouchableOpacity style={s.closeBtn} onPress={() => setReceiptVisible(false)}>
            <Text style={s.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        
        {activeTab === 'bookings' ? (
          // ACTIVE BOOKINGS VIEW
          <View>
            {currentBookings && currentBookings.length > 0 ? (
              currentBookings.map((booking) => (
                <View key={booking._id} style={s.ticketCard}>
                  <View style={s.ticketHeader}>
                    <View style={[s.statusPill, booking.status === 'Pending' && { backgroundColor: '#FEF3C7' }, booking.status === 'Expired' && { backgroundColor: '#FEE2E2' }]}>
                      <View style={[s.statusDot, booking.status === 'Pending' && { backgroundColor: '#F59E0B' }, booking.status === 'Expired' && { backgroundColor: '#DC2626' }]} />
                      <Text style={[s.statusText, booking.status === 'Pending' && { color: '#F59E0B' }, booking.status === 'Expired' && { color: '#DC2626' }]}>{booking.status}</Text>
                    </View>
                    <Text style={s.seatText}>Seat: {booking.seat || 'Pending'}</Text>
                  </View>
                  
                  <View style={s.ticketBody}>
                    <Image source={{ uri: booking.library?.photos?.[0] || 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80' }} style={s.ticketImage} />
                    <View style={s.ticketInfo}>
                      <Text style={s.libName} numberOfLines={1}>{booking.library?.name || 'Library Name'}</Text>
                      <Text style={s.slotText}>{booking.shift}</Text>
                      
                      <View style={s.dateRow}>
                        <View style={s.dateBox}>
                          <Text style={s.dateLabel}>Joined On</Text>
                          <Text style={s.dateValue}>{new Date(booking.startDate).toLocaleDateString()}</Text>
                        </View>
                        <View style={s.dateDivider} />
                        <View style={s.dateBox}>
                          <Text style={s.dateLabel}>Expires On</Text>
                          <Text style={[s.dateValue, { color: '#DC2626' }]}>{new Date(booking.endDate).toLocaleDateString()}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={s.ticketFooter}>
                    <TouchableOpacity style={s.actionBtn} onPress={() => handleFeeReceipt(booking)} activeOpacity={0.8}>
                      <Ionicons name="document-text-outline" size={16} color={tColors.primary} />
                      <Text style={s.actionBtnText}>Fee Receipt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionBtnOutline} onPress={() => handleMessageOwner(booking)} activeOpacity={0.8}>
                      <Ionicons name="chatbubbles-outline" size={16} color={tColors.primary} />
                      <Text style={s.actionBtnOutlineText}>Message Owner</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={s.empty}>
                <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
                <Text style={s.emptyTitle}>No Active Bookings</Text>
                <Text style={s.emptySub}>You haven&apos;t booked any seats yet. Go to Explore to find libraries.</Text>
                <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/student/tabs/home')}>
                  <Text style={s.browseBtnText}>Explore Libraries</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // SAVED LIBRARIES VIEW
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
            saved.map((lib) => (
              <TouchableOpacity 
                key={lib.id} 
                style={s.savedCard} 
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/student/library-detail', params: { id: lib.id } })}
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
                    <Text style={s.savedPrice}>₹{lib.halfTime?.fee}/mo</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>
      <ReceiptModal />
    </View>
  );
}
