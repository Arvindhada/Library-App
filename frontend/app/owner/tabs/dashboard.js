import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Alert, StatusBar, Image, Modal, ActivityIndicator, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../../src/context/AppContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../../../src/services/apiConfig';

const { width } = Dimensions.get('window');

// ── Stitch "LibConnect Design Identity" Colors ──
const C = {
  bg: '#F5F3EE',
  surface: '#FFFFFF',
  primary: '#0F6E56',
  primaryLight: '#E8F5F0',
  primaryBorder: '#9FE1CB',
  textDark: '#1A1C1B',
  textGray: '#6F7A74',
  border: '#D1CFCA',
  green: '#16A34A',
  red: '#DC2626',
  orange: '#C2410C',
  orangeLight: '#FFF3E8',
  orangeBorder: '#FDDCBB',
  chip: {
    green: { bg: '#DCFCE7', border: '#86EFAC', text: '#166534' },
    orange: { bg: '#FFF3E8', border: '#FDDCBB', text: '#C2410C' },
  }
};

export default function OwnerDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ownerData, currentLibrary, currentBookings, pendingBookings, dashboardStats, revenue, seatMap, fetchDashboardData, logout, loading } = useApp();
  const [notifModal, setNotifModal] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);



  const handleAccept = (req) => {
    setNotifModal(false);
    router.push({
      pathname: '/owner/seat-manager',
      params: { bookingId: req._id, studentName: req.student?.name || 'Student' },
    });
  };

  const handleReject = (req) => {
    Alert.alert('Reject Request', `Reject request from ${req.student?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(`${API_ENDPOINTS.BOOKINGS}/${req._id}/status`, { status: 'Rejected' }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            await fetchDashboardData();
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to reject request');
          }
        }
      }
    ]);
  };

  const handleLogout = () => {
    console.log('Logout button pressed');
    const msg = 'Kya aap logout karna chahte hain?';
    
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) logout(router);
    } else {
      Alert.alert('Logout', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout(router) },
      ]);
    }
  };

  const activeBookings = currentBookings || [];
  const occupiedCount = dashboardStats?.occupiedSeats ?? activeBookings.length;
  const totalSeats = dashboardStats?.totalSeats ?? currentLibrary?.total_seats ?? 48;
  const occupancy = dashboardStats?.occupancyPercent ?? (totalSeats > 0 ? Math.round((occupiedCount / totalSeats) * 100) : 0);
  const duePaymentsCount = dashboardStats?.duePayments ?? 0;

  // Revenue from new API — real figures from DB
  const todayRevenue = useMemo(() => revenue?.today || 0, [revenue]);
  const monthlyRevenue = useMemo(() => revenue?.thisMonth || 0, [revenue]);

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'S';

  // Seat map — use seatMap from context (comes from backend)
  // seatMap: { "1": { name, phone, shift, endDate, paymentStatus }, "5": {...} }
  const seatsToShow = totalSeats;
  const seatGrid = Array.from({ length: seatsToShow }, (_, i) => {
    const num = i + 1;
    const seatData = seatMap?.[String(num)];
    const isOcc = !!seatData;
    const isExp = seatData?.status === 'exp'; // Optional future flag
    
    return {
      num,
      label: String(num),
      status: isOcc ? 'occ' : 'free',
      booking: seatData || null
    };
  });

  const displayActive = activeBookings.length > 0 ? activeBookings.slice(0, 3) : [];
  const displayPending = pendingBookings.length > 0 ? pendingBookings.slice(0, 1) : [];

  // Dynamic Greeting based on time
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDashboardData} tintColor={C.primary} />
        }
      >

        {/* ── EMPTY STATE: NO LIBRARY ── */}
        {!currentLibrary && !loading && (
          <View style={s.regCard}>
            <View style={s.regIcon}>
              <Ionicons name="business" size={30} color={C.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={s.regTitle}>Register Your Library</Text>
              <Text style={s.regSub}>Manage students, fees, and seats in one place.</Text>
            </View>
            <TouchableOpacity 
              style={s.regBtn} 
              onPress={() => router.push('/owner/add-library')}
            >
              <Text style={s.regBtnTxt}>Start</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── HEADER ── */}
        <View style={s.header}>
          {/* Left: Photo + Text */}
          <View style={s.headerLeft}>
            <View style={s.photoWrap}>
              {ownerData?.photo ? (
                <Image source={{ uri: ownerData.photo }} style={s.photo} />
              ) : (
                <View style={s.photoPlaceholder}>
                  <Text style={s.photoInitial}>{ownerData?.name ? ownerData.name[0].toUpperCase() : 'R'}</Text>
                </View>
              )}
              <View style={s.onlineDot} />
            </View>
            <View style={s.headerText}>
              <Text style={s.greeting}>{greetingText}, {ownerData?.name?.split(' ')[0] || 'Owner'} 👋</Text>
              <Text style={s.libName} numberOfLines={1}>{currentLibrary?.name || 'Welcome to LibraryWala'}</Text>
            </View>
          </View>
          {/* Right: Bell + Logout */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={s.bellBtn}
              onPress={() => router.push('/owner/notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={20} color={C.primary} />
              {pendingBookings.length > 0 && (
                <View style={s.bellDot}>
                  <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800' }}>
                    {pendingBookings.length > 9 ? '9+' : pendingBookings.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.bellBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={C.red} />
            </TouchableOpacity>
          </View>
        </View>

        {currentLibrary && (
          <>
            {/* ── 2×2 STATS GRID ── */}
            <View style={s.gridRow}>
          {/* Revenue - Highlighted */}
          <View style={[s.card, s.cardHL]}>
            <Text style={s.cardLabelHL}>Today&apos;s Revenue</Text>
            <Text style={s.cardValHL}>₹{todayRevenue.toLocaleString('en-IN')}</Text>
            <Text style={s.cardSubGreen}>This Month: ₹{monthlyRevenue.toLocaleString('en-IN')}</Text>
          </View>
          {/* Seats */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Seats Occupied</Text>
            <Text style={s.cardVal}>
              {occupiedCount}<Text style={s.cardValSub}>/{totalSeats}</Text>
            </Text>
            <Text style={s.cardSubTeal}>{occupancy}% Occupancy</Text>
          </View>
        </View>
        <View style={[s.gridRow, { marginBottom: 20 }]}>
          {/* Due */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Due Payments</Text>
            <Text style={[s.cardVal, { color: C.red }]}>{duePaymentsCount}</Text>
            <Text style={[s.cardSubTeal, { color: C.red }]}>Action Required</Text>
          </View>
          {/* Expiring Soon */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Expiring Soon</Text>
            <Text style={[s.cardVal, { color: C.orange }]}>{dashboardStats?.expiringSoon ?? 0}</Text>
            <Text style={[s.cardSubTeal, { color: C.orange }]}>In next 5 days</Text>
          </View>
        </View>

        {/* ── LIVE SEAT MAP ── */}
        <View style={s.secHeader}>
          <Text style={s.secTitle}>Live Seat Map</Text>
          <TouchableOpacity onPress={() => router.push('/owner/seat-manager')}>
            <Text style={s.secLink}>Manage →</Text>
          </TouchableOpacity>
        </View>

        <View style={s.mapBox}>
          <View style={s.seatGrid}>
            {seatGrid.map((seat) => {
              const bg =
                seat.status === 'occ' ? s.sOcc :
                  seat.status === 'exp' ? s.sExp : s.sFree;
              const tc =
                seat.status === 'occ' ? '#FFF' :
                  seat.status === 'exp' ? C.orange : C.primary;
              return (
                <TouchableOpacity 
                  key={seat.num} 
                  style={[s.seat, bg]} 
                  activeOpacity={0.7}
                  onPress={() => setSelectedSeat(seat)}
                >
                  <Text style={[s.seatTxt, { color: tc }]}>{seat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={s.legend}>
            <View style={s.legItem}>
              <View style={[s.legDot, { backgroundColor: C.primary }]} />
              <Text style={s.legTxt}>Occupied</Text>
            </View>
            <View style={s.legItem}>
              <View style={[s.legDot, { backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primary }]} />
              <Text style={s.legTxt}>Free</Text>
            </View>
            <View style={s.legItem}>
              <View style={[s.legDot, { backgroundColor: C.orangeLight, borderWidth: 1, borderColor: C.orange }]} />
              <Text style={s.legTxt}>Expiring Soon</Text>
            </View>
          </View>
        </View>

        {/* ── AAJ KE STUDENTS ── */}
        <View style={s.secHeader}>
          <Text style={s.secTitle}>Today&apos;s Students</Text>
          <TouchableOpacity onPress={() => router.push('/owner/manage-students')}>
            <Text style={s.secLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        {/* Pending first (orange) */}
        {displayPending.map((st, i) => (
          <View key={`p_${st._id || i}`} style={[s.stCard, s.stCardOrange]}>
            <View style={[s.ava, { backgroundColor: C.orangeBorder }]}>
              <Text style={[s.avaTxt, { color: C.orange }]}>{getInitials(st.student?.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.stName}>{st.student?.name}</Text>
              <Text style={[s.stMeta, { color: '#9A3412' }]}>Seat {st.seat} · Fee Overdue</Text>
            </View>
            <View style={[s.chip, { backgroundColor: C.chip.orange.bg, borderColor: C.chip.orange.border }]}>
              <Text style={[s.chipTxt, { color: C.chip.orange.text }]}>Renew</Text>
            </View>
          </View>
        ))}

        {/* Active students */}
        {displayActive.map((st, i) => (
          <View key={`a_${st._id || i}`} style={s.stCard}>
            <View style={s.ava}>
              <Text style={s.avaTxt}>{getInitials(st.student?.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.stName}>{st.student?.name}</Text>
              <Text style={s.stMeta}>Seat {st.seat} · {st.shift} · Ends {new Date(st.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
            </View>
            <View style={[s.chip, { backgroundColor: C.chip.green.bg, borderColor: C.chip.green.border }]}>
              <Text style={[s.chipTxt, { color: C.chip.green.text }]}>Active</Text>
            </View>
          </View>
        ))}

            {displayActive.length === 0 && displayPending.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border }}>
                <Ionicons name="people-outline" size={32} color={C.textGray} />
                <Text style={{ color: C.textGray, marginTop: 10, fontSize: 14 }}>No students assigned yet.</Text>
              </View>
            )}

            <View style={{ height: 90 }} />
          </>
        )}
      </ScrollView>

      {/* ── NOTIFICATION MODAL ── */}
      <Modal visible={notifModal} animationType="slide" transparent>
        <View style={s.notifOverlay}>
          <View style={s.notifBox}>
            {/* Header */}
            <View style={s.notifHead}>
              <View>
                <Text style={s.notifTitle}>Notifications</Text>
                <Text style={s.notifSub}>Join Requests</Text>
              </View>
              <TouchableOpacity onPress={() => setNotifModal(false)}>
                <Ionicons name="close" size={22} color={C.textGray} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator color={C.primary} size="large" />
                <Text style={{ color: C.textGray, marginTop: 10 }}>Loading requests...</Text>
              </View>
            ) : pendingBookings.length === 0 ? (
              <View style={{ padding: 50, alignItems: 'center', gap: 12 }}>
                <Ionicons name="checkmark-circle-outline" size={48} color={C.primaryBorder} />
                <Text style={{ color: C.textGray, fontSize: 15, fontWeight: '500' }}>
                  No pending requests
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {pendingBookings.map(req => {
                  const initials = req.student?.name
                    ? req.student.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'S';
                  return (
                    <View key={req._id} style={s.reqCard}>
                      {/* Avatar */}
                      {req.student?.photo ? (
                        <Image source={{ uri: req.student.photo }} style={s.reqAva} />
                      ) : (
                        <View style={s.reqAvaPlaceholder}>
                          <Text style={s.reqAvaInit}>{initials}</Text>
                        </View>
                      )}
                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={s.reqName}>{req.student?.name || 'Student'}</Text>
                        <Text style={s.reqMeta}>
                          📞 {req.student?.phone || 'N/A'}
                        </Text>
                        <Text style={s.reqMeta}>
                          🪑 Seat {req.seat} · {req.shift}
                        </Text>
                      </View>
                      {/* Action Buttons */}
                      <View style={{ gap: 8 }}>
                        <TouchableOpacity
                          style={s.acceptBtn}
                          onPress={() => handleAccept(req)}
                          disabled={actionId === req._id}
                          activeOpacity={0.85}
                        >
                          {actionId === req._id
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Text style={s.acceptTxt}>✓ Accept</Text>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.rejectBtn}
                          onPress={() => handleReject(req)}
                          activeOpacity={0.8}
                        >
                          <Text style={s.rejectTxt}>✕ Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── SEAT DETAILS MODAL ── */}
      <Modal visible={!!selectedSeat} transparent animationType="fade" onRequestClose={() => setSelectedSeat(null)}>
        <TouchableOpacity style={s.seatModalOverlay} activeOpacity={1} onPress={() => setSelectedSeat(null)}>
          <TouchableOpacity activeOpacity={1} style={s.seatModalCard}>

            {/* Colored Header */}
            <View style={[
              s.seatModalHeader,
              { backgroundColor: selectedSeat?.status === 'occ' ? C.primary : selectedSeat?.status === 'exp' ? C.orange : C.green }
            ]}>
              <View style={s.seatModalBadge}>
                <Text style={s.seatModalBadgeTxt}>{selectedSeat?.label}</Text>
              </View>
              <Text style={s.seatModalTitle}>Seat {selectedSeat?.label}</Text>
              <Text style={s.seatModalSub}>
                {selectedSeat?.status === 'occ' ? '🔴 Occupied' : selectedSeat?.status === 'exp' ? '⚠️ Fee Overdue' : '🟢 Available'}
              </Text>
            </View>

            {/* Body */}
            <View style={s.seatModalBody}>
              {selectedSeat?.booking ? (
                <>
                  {/* Student Info Row */}
                  <View style={s.seatModalStudentRow}>
                    <View style={s.seatModalAvatar}>
                      <Text style={s.seatModalAvatarTxt}>{getInitials(selectedSeat.booking.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.seatModalName}>{selectedSeat.booking.name || 'Unknown Student'}</Text>
                      <Text style={s.seatModalPhone}>
                        <Ionicons name="call-outline" size={13} color={C.primary} /> +91 {(selectedSeat.booking.phone || 'N/A').replace('+91','')}
                      </Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={s.seatModalInfoBox}>
                    <View style={s.seatModalInfoRow}>
                      <Text style={s.seatModalInfoLabel}>Shift</Text>
                      <Text style={s.seatModalInfoValue}>{selectedSeat.booking.shift || 'Full Day'}</Text>
                    </View>
                    <View style={s.seatModalDivider} />
                    <View style={s.seatModalInfoRow}>
                      <Text style={s.seatModalInfoLabel}>Ends On</Text>
                      <Text style={[s.seatModalInfoValue, { color: selectedSeat?.status === 'exp' ? C.red : C.green }]}>
                        {selectedSeat.booking.endDate
                          ? new Date(selectedSeat.booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'N/A'}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={s.seatModalEmptyState}>
                  <Ionicons name="bed-outline" size={52} color={C.primaryBorder} />
                  <Text style={s.seatModalEmptyTxt}>Seat is vacant and ready to assign</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={s.seatModalBtns}>
                <TouchableOpacity style={s.seatModalCloseBtn} onPress={() => setSelectedSeat(null)}>
                  <Text style={s.seatModalCloseTxt}>Close</Text>
                </TouchableOpacity>
                {selectedSeat?.status !== 'free' ? (
                  <TouchableOpacity
                    style={s.seatModalManageBtn}
                    onPress={() => { setSelectedSeat(null); router.push('/owner/tabs/students'); }}
                  >
                    <Ionicons name="people-outline" size={16} color="#FFF" />
                    <Text style={s.seatModalManageTxt}>Manage</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={s.seatModalManageBtn}
                    onPress={() => { setSelectedSeat(null); router.push({ pathname: '/owner/tabs/students', params: { autoAdd: 'true', seat: selectedSeat?.label } }); }}
                  >
                    <Ionicons name="person-add-outline" size={16} color="#FFF" />
                    <Text style={s.seatModalManageTxt}>Assign</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

// Seat size: fill full width with 6px gap between 8 seats
const SEAT_W = Math.floor((width - 32 - 7 * 6) / 8);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  // ── HEADER ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  photoWrap: { position: 'relative', flexShrink: 0 },
  photo: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: C.primaryBorder },
  photoPlaceholder: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primaryBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  photoInitial: { fontSize: 20, fontWeight: '700', color: C.primary },
  onlineDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: C.green,
    position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: C.bg,
  },
  headerText: { flex: 1 },
  greeting: { color: C.textGray, fontSize: 13, fontWeight: '500', marginBottom: 2 },
  libName: { color: C.textDark, fontSize: 18, fontWeight: '700' },
  bellBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  bellDot: {
    minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.red,
    position: 'absolute', top: -2, right: -2, borderWidth: 1.5, borderColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },

  // ── NOTIFICATION MODAL ──
  notifOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  notifBox: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: '85%',
  },
  notifHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  notifTitle: { color: C.textDark, fontSize: 20, fontWeight: '700' },
  notifSub: { color: C.textGray, fontSize: 13, marginTop: 2 },

  // Request Card
  reqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bg, borderRadius: 16, borderWidth: 0.5, borderColor: C.border,
    padding: 14, marginBottom: 12,
  },
  reqAva: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: C.primaryBorder },
  reqAvaPlaceholder: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.primaryLight, borderWidth: 1.5, borderColor: C.primaryBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  reqAvaInit: { fontSize: 16, fontWeight: '700', color: C.primary },
  reqName: { color: C.textDark, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  reqMeta: { color: C.textGray, fontSize: 12, fontWeight: '500', marginBottom: 1 },
  acceptBtn: {
    backgroundColor: C.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 80,
  },
  acceptTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  rejectBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 10, borderWidth: 0.5, borderColor: '#FCA5A5',
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 80,
  },
  rejectTxt: { color: C.red, fontSize: 13, fontWeight: '700' },

  // ── STATS GRID ──
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 0.5, borderColor: C.border, padding: 18,
  },
  cardHL: { backgroundColor: C.primaryLight, borderColor: C.primaryBorder },
  cardLabel: { color: C.textGray, fontSize: 13, marginBottom: 6, fontWeight: '500' },
  cardLabelHL: { color: '#085041', fontSize: 13, marginBottom: 6, fontWeight: '600' },
  cardVal: { color: C.textDark, fontSize: 30, fontWeight: '700', lineHeight: 36 },
  cardValHL: { color: C.primary, fontSize: 30, fontWeight: '800', lineHeight: 36 },
  cardValSub: { fontSize: 16, color: C.textGray, fontWeight: '400' },
  cardSubGreen: { color: C.green, fontSize: 13, marginTop: 6, fontWeight: '600' },
  cardSubTeal: { color: C.primary, fontSize: 13, marginTop: 6, fontWeight: '500' },

  // ── SECTION HEADER ──
  secHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  secTitle: { color: C.textDark, fontSize: 16, fontWeight: '700' },
  secLink: { color: C.primary, fontSize: 13, fontWeight: '600' },

  // ── SEAT MAP ──
  mapBox: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 0.5, borderColor: C.border,
    padding: 10, marginBottom: 20,
  },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' },
  seat: {
    width: SEAT_W, height: SEAT_W, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
  },
  sOcc: { backgroundColor: C.primary },
  sFree: { backgroundColor: C.primaryLight, borderWidth: 0.5, borderColor: C.primary },
  sExp: { backgroundColor: C.orangeLight, borderWidth: 0.5, borderColor: C.orange },
  seatTxt: { fontSize: 8, fontWeight: '700', textAlign: 'center' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 10, justifyContent: 'center' },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legDot: { width: 10, height: 10, borderRadius: 3 },
  legTxt: { color: C.textGray, fontSize: 11, fontWeight: '500' },

  // ── STUDENT CARDS ──
  stCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 0.5, borderColor: C.border,
    paddingVertical: 13, paddingHorizontal: 14, marginBottom: 9,
  },
  stCardOrange: { backgroundColor: C.orangeLight, borderColor: C.orangeBorder },
  ava: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  avaTxt: { fontSize: 13, fontWeight: '700', color: C.primary },
  stName: { color: C.textDark, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  stMeta: { color: C.textGray, fontSize: 12, fontWeight: '500' },
  chip: {
    borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipTxt: { fontSize: 11, fontWeight: '700' },
  // Registration Card
  regCard: {
    backgroundColor: C.surface, borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: C.primaryBorder,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
  },
  regIcon: {
    width: 60, height: 60, borderRadius: 15,
    backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  regTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
  regSub: { fontSize: 13, color: C.textGray, marginTop: 4 },
  regBtn: {
    backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, marginLeft: 10,
  },
  regBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // ── SEAT DETAIL MODAL ──
  seatModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  seatModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: C.surface,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  seatModalHeader: {
    paddingTop: 28, paddingBottom: 22,
    alignItems: 'center',
    gap: 6,
  },
  seatModalBadge: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  seatModalBadgeTxt: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  seatModalTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  seatModalSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  seatModalBody: { padding: 20 },

  seatModalStudentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 16,
  },
  seatModalAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primaryBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  seatModalAvatarTxt: { fontSize: 18, fontWeight: '800', color: C.primary },
  seatModalName: { fontSize: 17, fontWeight: '700', color: C.textDark, marginBottom: 3 },
  seatModalPhone: { fontSize: 13, color: C.primary, fontWeight: '500' },

  seatModalInfoBox: {
    backgroundColor: C.bg, borderRadius: 14,
    borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 16, marginBottom: 20,
  },
  seatModalInfoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 13,
  },
  seatModalDivider: { height: 0.5, backgroundColor: C.border },
  seatModalInfoLabel: { fontSize: 14, color: C.textGray, fontWeight: '500' },
  seatModalInfoValue: { fontSize: 14, color: C.textDark, fontWeight: '700' },

  seatModalEmptyState: { alignItems: 'center', paddingVertical: 24, gap: 10, marginBottom: 16 },
  seatModalEmptyTxt: { fontSize: 15, color: C.textGray, textAlign: 'center', fontWeight: '500' },

  seatModalBtns: { flexDirection: 'row', gap: 10 },
  seatModalCloseBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.primaryLight, alignItems: 'center',
    borderWidth: 0.5, borderColor: C.primaryBorder,
  },
  seatModalCloseTxt: { color: C.primary, fontWeight: '700', fontSize: 15 },
  seatModalManageBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.primary, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  seatModalManageTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
