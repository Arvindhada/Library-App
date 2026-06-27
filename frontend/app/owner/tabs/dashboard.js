import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Alert, StatusBar, Image, Modal, ActivityIndicator
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../../src/context/AppContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../../../src/services/apiConfig';

const { width } = Dimensions.get('window');

// ── Colors ──
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
  const { ownerData, currentLibrary, currentBookings, setCurrentBookings, fetchDashboardData, loading, revenueTransactions, acceptBooking, rejectBooking } = useApp();
  
  // Notification states
  const [notifModal, setNotifModal] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadReq, setLoadReq] = useState(false);
  const [actionId, setActionId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      fetchJoinRequests();
    }, [])
  );

  const fetchJoinRequests = async () => {
    setLoadReq(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_ENDPOINTS.BOOKINGS}?status=Requested`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJoinRequests(res.data?.bookings || res.data || []);
    } catch (e) {
      console.warn('Could not load join requests:', e.message);
      setJoinRequests([]);
    } finally {
      setLoadReq(false);
    }
  };

  const handleAccept = async (req) => {
    setActionId(req._id);
    try {
      await acceptBooking(req._id);
      setJoinRequests(prev => prev.filter(r => r._id !== req._id));
      Alert.alert('✅ Accepted!', `${req.student?.name || 'Student'} added. Collect fee to activate full membership.`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not accept request. Check connection.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = (req) => {
    Alert.alert('Reject Request', `Reject booking request from ${req.student?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            await rejectBooking(req._id);
            setJoinRequests(prev => prev.filter(r => r._id !== req._id));
          } catch (e) {
            Alert.alert('Error', 'Could not reject request. Check connection.');
          }
        }
      }
    ]);
  };

  // Active + Pending both count as occupied seats
  const activeBookings = currentBookings?.filter(b => ['Active', 'Pending', 'Requested'].includes(b.status)) || [];
  const occupiedCount = activeBookings.length;
  const totalSeats = currentLibrary?.total_seats || currentLibrary?.totalSeats || 50;
  const occupancy = totalSeats > 0 ? Math.round((occupiedCount / totalSeats) * 100) : 0;

  // Due payments: bookings where fee not paid or expired
  const dueBookings = currentBookings?.filter(b => {
    const exp = new Date(b.endDate);
    return (exp < new Date() && b.status !== 'Inactive') || b.status === 'Pending';
  }) || [];
  const dueCount = dueBookings.length;

  // Real-time Today's Revenue Calculation
  const todayRevenue = useMemo(() => {
    if (!revenueTransactions || revenueTransactions.length === 0) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    return revenueTransactions.reduce((sum, p) => {
      const pDate = p.date ? p.date.split('T')[0] : (p.createdAt ? p.createdAt.split('T')[0] : '');
      if (pDate === todayStr && p.type === 'income') {
        return sum + (p.amount || 0);
      }
      return sum;
    }, 0);
  }, [revenueTransactions]);

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'S';

  // Live Seat Grid Mapping
  const seatsToShow = Math.min(totalSeats, 48);
  const seatGrid = Array.from({ length: seatsToShow }, (_, i) => {
    const num = i + 1;
    const isOcc = activeBookings.some(b => String(b.seat) === String(num));
    const isDue = dueBookings.some(b => String(b.seat) === String(num));
    return {
      num,
      label: String(num),
      status: isDue ? 'exp' : isOcc ? 'occ' : 'free'
    };
  });

  const displayActive = activeBookings.slice(0, 3);
  const displayPending = dueBookings.slice(0, 2);

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

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerText}>
              <Text style={s.greeting}>
                {(() => {
                  const h = new Date().getHours();
                  if (h < 12) return `Good Morning, ${ownerData?.name?.split(' ')[0] || 'Owner'} ☀️`;
                  if (h < 17) return `Good Afternoon, ${ownerData?.name?.split(' ')[0] || 'Owner'} 👋`;
                  return `Good Evening, ${ownerData?.name?.split(' ')[0] || 'Owner'} 🌙`;
                })()}
              </Text>
              <Text style={s.libName} numberOfLines={1}>{currentLibrary?.name || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── 2×2 STATS GRID ── */}
        <View style={s.gridRow}>
          {/* Revenue */}
          <TouchableOpacity style={[s.card, s.cardHL]} onPress={() => router.push('/owner/reports')} activeOpacity={0.85}>
            <Text style={s.cardLabelHL}>{"Today's Revenue"}</Text>
            <Text style={s.cardValHL}>₹{todayRevenue.toLocaleString('en-IN')}</Text>
            <View style={s.revenueLink}>
              <Text style={s.revenueLinkTxt}>View Full Report</Text>
              <Ionicons name="arrow-forward" size={11} color={C.primary} />
            </View>
          </TouchableOpacity>

          {/* Seats Occupied */}
          <TouchableOpacity style={s.card} onPress={() => router.push('/owner/seat-manager')} activeOpacity={0.85}>
            <Text style={s.cardLabel}>Seats Occupied</Text>
            <Text style={s.cardVal}>
              {occupiedCount}<Text style={s.cardValSub}>/{totalSeats}</Text>
            </Text>
            <Text style={s.cardSubTeal}>{occupancy}% Occupancy</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.gridRow, { marginBottom: 16 }]}>
          {/* Dues */}
          <TouchableOpacity style={s.card} onPress={() => router.push('/owner/reports')} activeOpacity={0.85}>
            <Text style={s.cardLabel}>Due Payments</Text>
            <Text style={[s.cardVal, dueCount > 0 && { color: C.red }]}>{dueCount}</Text>
            <Text style={[s.cardSubTeal, dueCount > 0 && { color: C.red }]}>
              {dueCount > 0 ? 'Action Required' : 'All Clear'}
            </Text>
          </TouchableOpacity>

          {/* Inquiries / Tappable to open Requests Modal */}
          <TouchableOpacity 
            style={s.card} 
            onPress={() => { setNotifModal(true); fetchJoinRequests(); }}
            activeOpacity={0.85}
          >
            <Text style={s.cardLabel}>New Inquiries</Text>
            <Text style={s.cardVal}>{joinRequests.length}</Text>
            <Text style={s.cardSubTeal}>Click to Approve</Text>
          </TouchableOpacity>
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
              
              const handleSeatPress = () => {
                const activeMatch = activeBookings.find(b => String(b.seat) === String(seat.num));
                if (activeMatch) {
                  Alert.alert(`Seat ${seat.label} - Occupied`, `Student: ${activeMatch.student?.name || 'Unknown'}\nShift: ${activeMatch.shift || 'Unknown'}`);
                  return;
                }
                const pendingMatch = dueBookings.find(b => String(b.seat) === String(seat.num));
                if (pendingMatch) {
                  Alert.alert(`Seat ${seat.label} - Expiring Soon`, `Student: ${pendingMatch.student?.name || 'Unknown'}\nAction Required: Fee is overdue.`);
                  return;
                }
                Alert.alert(
                  `Seat ${seat.label}`,
                  "This seat is empty.",
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Add Student', 
                      style: 'default',
                      onPress: () => router.push({ pathname: '/owner/tabs/students', params: { seat: seat.num } })
                    }
                  ]
                );
              };

              return (
                <TouchableOpacity key={seat.num} style={[s.seat, bg]} onPress={handleSeatPress} activeOpacity={0.7}>
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

        {/* ── TODAY'S STUDENTS ── */}
        <View style={s.secHeader}>
          <Text style={s.secTitle}>{"Today's Students"}</Text>
          <TouchableOpacity onPress={() => router.push('/owner/tabs/students')}>
            <Text style={s.secLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        {displayPending.length === 0 && displayActive.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={32} color={C.textGray} />
            <Text style={s.emptyStateTxt}>No students registered yet</Text>
          </View>
        ) : (
          <>
            {/* Pending / Overdue first */}
            {displayPending.map((st, i) => (
              <View key={`p_${st._id || i}`} style={[s.stCard, s.stCardOrange]}>
                <View style={[s.ava, { backgroundColor: C.orangeBorder }]}>
                  <Text style={[s.avaTxt, { color: C.orange }]}>{getInitials(st.student?.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stName}>{st.student?.name}</Text>
                  <Text style={[s.stMeta, { color: '#9A3412' }]}>Seat {st.seat} · Fee Overdue</Text>
                </View>
                <TouchableOpacity 
                  style={[s.chip, { backgroundColor: C.chip.orange.bg, borderColor: C.chip.orange.border }]}
                  onPress={() => router.push('/owner/tabs/students')}
                >
                  <Text style={[s.chipTxt, { color: C.chip.orange.text }]}>Renew</Text>
                </TouchableOpacity>
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
                  <Text style={s.stMeta}>Seat {st.seat} · {st.shift} · Active</Text>
                </View>
                <View style={[s.chip, { backgroundColor: C.chip.green.bg, borderColor: C.chip.green.border }]}>
                  <Text style={[s.chipTxt, { color: C.chip.green.text }]}>Active</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── NOTIFICATION / REQUESTS MODAL ── */}
      <Modal visible={notifModal} animationType="slide" transparent>
        <View style={s.notifOverlay}>
          <View style={s.notifBox}>
            <View style={s.notifHead}>
              <View>
                <Text style={s.notifTitle}>Booking Requests</Text>
                <Text style={s.notifSub}>Pending Join Requests</Text>
              </View>
              <TouchableOpacity onPress={() => setNotifModal(false)}>
                <Ionicons name="close" size={24} color={C.textGray} />
              </TouchableOpacity>
            </View>

            {loadReq ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator color={C.primary} size="large" />
                <Text style={{ color: C.textGray, marginTop: 10 }}>Loading requests...</Text>
              </View>
            ) : joinRequests.length === 0 ? (
              <View style={{ padding: 50, alignItems: 'center', gap: 12 }}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#9FE1CB" />
                <Text style={{ color: C.textGray, fontSize: 15, fontWeight: '500' }}>
                  No pending requests
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {joinRequests.map(req => {
                  const initials = req.student?.name
                    ? req.student.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'S';
                  return (
                    <View key={req._id} style={s.reqCard}>
                      <View style={s.reqAvaPlaceholder}>
                        <Text style={s.reqAvaInit}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.reqName}>{req.student?.name || 'Student'}</Text>
                        <Text style={s.reqMeta}>📞 {req.student?.phone || 'N/A'}</Text>
                        <Text style={s.reqMeta}>🪑 Seat {req.seat} · {req.shift}</Text>
                      </View>
                      <View style={{ gap: 8 }}>
                        <TouchableOpacity
                          style={s.acceptBtn}
                          onPress={() => handleAccept(req)}
                          disabled={actionId === req._id}
                          activeOpacity={0.85}
                        >
                          {actionId === req._id
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Text style={s.acceptTxt}>Accept</Text>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.rejectBtn}
                          onPress={() => handleReject(req)}
                          activeOpacity={0.8}
                        >
                          <Text style={s.rejectTxt}>Reject</Text>
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

    </View>
  );
}

const SEAT_W = Math.floor((width - 32 - 7 * 6) / 8);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

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

  // Stats Grid
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
  cardSubTeal: { color: C.primary, fontSize: 13, marginTop: 6, fontWeight: '500' },
  revenueLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  revenueLinkTxt: { color: C.primary, fontSize: 12, fontWeight: '700' },

  secHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  secTitle: { color: C.textDark, fontSize: 16, fontWeight: '700' },
  secLink: { color: C.primary, fontSize: 13, fontWeight: '600' },

  // Seat Map
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

  // Student Cards
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

  emptyState: {
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border,
    padding: 30, alignItems: 'center', gap: 8,
  },
  emptyStateTxt: { fontSize: 14, color: C.textGray, fontWeight: '500' },

  // Notification Modal Styles
  notifOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  notifBox: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: '80%',
  },
  notifHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  notifTitle: { color: C.textDark, fontSize: 20, fontWeight: '700' },
  notifSub: { color: C.textGray, fontSize: 13, marginTop: 2 },
  
  // Request Card
  reqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F5F3EE', borderRadius: 16, borderWidth: 0.5, borderColor: '#D1CFCA',
    padding: 14, marginBottom: 12,
  },
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
});
