import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_ENDPOINTS } from '../../../src/services/apiConfig';
import { useApp } from '../../../src/context/AppContext';

const C = {
  bg: '#F5F3EE',
  surface: '#FFFFFF',
  primary: '#0F6E56',
  primaryLight: '#E8F5F0',
  primaryBorder: '#9FE1CB',
  textDark: '#1A1C1B',
  textGray: '#6F7A74',
  border: '#D1CFCA',
  red: '#DC2626',
};

export default function OwnerRequests() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentLibrary, currentBookings, seatMap, fetchDashboardData } = useApp();
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Modal State for Student Profile
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => { loadRequests(); }, [currentLibrary]);

  const loadRequests = async () => {
    if (!currentLibrary?._id) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const pendingRes = await axios.get(
        `${API_ENDPOINTS.BOOKINGS}/library/${currentLibrary._id}?status=Pending`,
        config
      );
      setRequests(pendingRes.data?.bookings || []);

      const historyRes = await axios.get(
        `${API_ENDPOINTS.BOOKINGS}/library/${currentLibrary._id}?status=Rejected`,
        config
      );

      // Group history by student to show rejection counts
      const rejectedList = historyRes.data?.bookings || [];
      const grouped = {};
      rejectedList.forEach(req => {
        const studentId = req.student?._id || req.student?.id;
        if (!studentId) return;
        if (!grouped[studentId]) {
          grouped[studentId] = { 
            name: req.student?.name || 'Student', 
            count: 0, 
            id: studentId 
          };
        }
        grouped[studentId].count += 1;
      });
      
      setHistory(Object.values(grouped));
    } catch (e) {
      console.error('Load requests error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId, status, studentName) => {
    // If approving → navigate to Seat Manager in assignment mode
    if (status === 'Active') {
      router.push({
        pathname: '/owner/seat-manager',
        params: { bookingId, studentName: studentName || 'Student' },
      });
      return;
    }

    // Reject flow — directly call API
    setProcessingId(bookingId);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(
        `${API_ENDPOINTS.BOOKINGS}/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('❌ Rejected', `${studentName || 'Student'} ki request reject ho gayi.`);
      loadRequests();
      fetchDashboardData();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'S';

  const viewProfile = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRequests} tintColor={C.primary} />}
      >
        <Text style={s.title}>Student Requests</Text>
        <Text style={s.subtitle}>Manage new booking requests</Text>

        {/* PENDING REQUESTS */}
        <Text style={s.sectionLabel}>NEW REQUESTS ({requests.length})</Text>

        {!currentLibrary?._id ? (
          <View style={s.emptyBox}>
            <Ionicons name="business-outline" size={48} color={C.border} />
            <Text style={s.emptyText}>Library not set up yet</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="mail-open-outline" size={48} color={C.border} />
            <Text style={s.emptyText}>No pending requests</Text>
          </View>
        ) : (
          requests.map(req => (
            <View key={req._id} style={s.card}>
              <View style={s.cardTop}>
                <View style={s.avatar}>
                  {req.student?.photo ? (
                    <Image source={{ uri: req.student.photo }} style={s.avatarImg} />
                  ) : (
                    <Text style={s.avatarTxt}>{getInitials(req.student?.name)}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.studentName}>{req.student?.name || 'New Student'}</Text>
                  <Text style={s.studentPhone}>📞 {req.student?.phone || 'N/A'}</Text>
                </View>
                <TouchableOpacity 
                  style={s.viewProfileBtn}
                  onPress={() => viewProfile(req.student)}
                >
                  <Ionicons name="person-circle-outline" size={20} color={C.primary} />
                  <Text style={s.viewProfileTxt}>View Details</Text>
                </TouchableOpacity>
              </View>

              <View style={s.bookingSummary}>
                 <View style={s.planBadge}>
                    <Text style={s.planTxt}>{req.shift}</Text>
                 </View>
                 <View style={s.detailRow}>
                    <Ionicons name="location-outline" size={13} color={C.textGray} />
                    <Text style={s.detailTxt}>Seat {req.seat || 'Auto'}</Text>
                    <Ionicons name="calendar-outline" size={13} color={C.textGray} style={{ marginLeft: 12 }} />
                    <Text style={s.detailTxt}>
                      {req.startDate ? new Date(req.startDate).toLocaleDateString('en-IN') : 'N/A'}
                    </Text>
                 </View>
              </View>

              <View style={s.actionRow}>
                <TouchableOpacity
                  style={s.rejectBtn}
                  onPress={() => handleAction(req._id, 'Rejected', req.student?.name)}
                  disabled={processingId === req._id}
                >
                  {processingId === req._id
                    ? <ActivityIndicator size="small" color={C.red} />
                    : <Text style={s.rejectTxt}>✕ Reject</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.approveBtn}
                  onPress={() => handleAction(req._id, 'Active', req.student?.name)}
                  disabled={processingId === req._id}
                >
                  {processingId === req._id
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={s.approveTxt}>✓ Approve</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* HISTORY */}
        {history.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { marginTop: 24 }]}>RECENT HISTORY</Text>
            {history.slice(0, 10).map(item => (
              <View key={item.id} style={s.historyCard}>
                <Ionicons name="close-circle" size={20} color={C.red} />
                <Text style={s.historyName}>{item.name}</Text>
                <View style={s.countBadge}>
                  <Text style={s.countText}>{item.count}</Text>
                </View>
                <Text style={[s.historyStatus, { color: C.red }]}>Rejected</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* STUDENT PROFILE MODAL */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Student Profile</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={C.textDark} />
              </TouchableOpacity>
            </View>

            {selectedStudent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.modalBody}>
                  <View style={s.profileHeader}>
                    <View style={s.largeAvatar}>
                      {selectedStudent.photo ? (
                        <Image source={{ uri: selectedStudent.photo }} style={s.largeAvatarImg} />
                      ) : (
                        <Text style={s.largeAvatarTxt}>{getInitials(selectedStudent.name)}</Text>
                      )}
                    </View>
                    <Text style={s.modalStudentName}>{selectedStudent.name || 'Student'}</Text>
                    <Text style={s.modalStudentPhone}>{selectedStudent.phone}</Text>
                  </View>

                  <View style={s.infoSection}>
                    <View style={s.infoRow}>
                      <Ionicons name="location" size={18} color={C.primary} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={s.infoLabel}>City / Area</Text>
                        <Text style={s.infoValue}>{selectedStudent.city || 'Jaipur'}</Text>
                      </View>
                    </View>

                    <View style={s.infoRow}>
                      <Ionicons name="school" size={18} color={C.primary} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={s.infoLabel}>Study Goal / Exam</Text>
                        <Text style={s.infoValue}>{selectedStudent.studyGoal || 'Not specified'}</Text>
                      </View>
                    </View>

                    {selectedStudent.email && (
                      <View style={s.infoRow}>
                        <Ionicons name="mail" size={18} color={C.primary} />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={s.infoLabel}>Email</Text>
                          <Text style={s.infoValue}>{selectedStudent.email}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={s.closeBtn} 
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={s.closeBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  title: { color: C.textDark, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: C.textGray, fontSize: 13, marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: C.textGray, letterSpacing: 1, marginBottom: 12 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: C.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarTxt: { fontSize: 16, fontWeight: '700', color: C.primary },
  studentName: { fontSize: 15, fontWeight: '700', color: C.textDark },
  studentPhone: { fontSize: 12, color: C.textGray, marginTop: 2 },
  planBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 0.5, borderColor: C.primaryBorder },
  planTxt: { fontSize: 11, fontWeight: '700', color: C.primary },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  detailTxt: { fontSize: 13, color: C.textGray, marginLeft: 2 },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  approveTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#FCA5A5' },
  rejectTxt: { color: C.red, fontWeight: '700', fontSize: 14 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, padding: 12, borderRadius: 12, marginBottom: 8, gap: 10, borderWidth: 0.5, borderColor: C.border },
  historyName: { flex: 1, fontSize: 14, fontWeight: '600', color: C.textDark },
  historyStatus: { fontSize: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: C.textGray, fontWeight: '500' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 0.5, borderBottomColor: C.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
  modalBody: { padding: 24 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  largeAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden', borderWidth: 3, borderColor: C.primaryLight },
  largeAvatarImg: { width: 100, height: 100, borderRadius: 50 },
  largeAvatarTxt: { fontSize: 32, fontWeight: '700', color: C.primary },
  modalStudentName: { fontSize: 22, fontWeight: '700', color: C.textDark, marginBottom: 4 },
  modalStudentPhone: { fontSize: 16, color: C.textGray },
  infoSection: { backgroundColor: C.bg, borderRadius: 16, padding: 20, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  infoLabel: { fontSize: 12, color: C.textGray, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 16, color: C.textDark, fontWeight: '600', marginTop: 2 },
  closeBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Seat Modal Styles
  seatModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  seatModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' },
  legendRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: C.textGray, fontWeight: '600' },
  seatGridContainer: { maxHeight: 300, marginHorizontal: 16, marginVertical: 8 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16 },
  // Available seat
  seatOption: { width: 56, minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 12, backgroundColor: '#E8F5F0', borderWidth: 1.5, borderColor: C.primaryBorder },
  seatOptionText: { fontSize: 14, fontWeight: '800', color: C.primary },
  // Selected seat
  seatSelected: { backgroundColor: '#FFA500', borderColor: '#E67E00' },
  seatSelectedText: { color: '#FFF' },
  // Occupied seat
  seatOccupied: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', minHeight: 66 },
  seatOccupiedText: { color: '#EF4444', fontSize: 13 },
  seatBookedLabel: { fontSize: 8, fontWeight: '700', color: '#EF4444', textAlign: 'center', marginTop: 2, lineHeight: 11 },
  seatModalFooter: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#FFF' },
  seatCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F0F0F0' },
  seatCancelText: { fontSize: 14, fontWeight: '700', color: C.textGray },
  seatConfirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: C.primary },
  seatConfirmText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  selectedSeatBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF3E0', marginHorizontal: 16, marginTop: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#FFB74D' },
  selectedSeatBannerText: { fontSize: 13, fontWeight: '700', color: '#E67E00' },
  countBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' },
  countText: { fontSize: 12, fontWeight: '800', color: C.red },
});

