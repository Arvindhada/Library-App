import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Alert, StatusBar, Image, Modal, ActivityIndicator
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
  const { ownerData, currentLibrary, currentBookings, fetchDashboardData, loading } = useApp();

  useEffect(() => { fetchDashboardData(); }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userRole');
          router.replace('/owner/login');
        }
      },
    ]);
  };

  const activeBookings = currentBookings.filter(b => b.status === 'Active');
  const pendingBookings = currentBookings.filter(b => b.status === 'Pending');
  const occupiedCount = activeBookings.length;
  const totalSeats = currentLibrary?.total_seats || 48;
  const occupancy = totalSeats > 0 ? Math.round((occupiedCount / totalSeats) * 100) : 70;

  const todayRevenue = useMemo(() => {
    return activeBookings.length * (currentLibrary?.fullTime?.fee || 0) || 1840;
  }, [activeBookings, currentLibrary]);

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'S';

  // Seat map - show all seats (max 48 for display), numbered 1, 2, 3...
  const seatsToShow = Math.min(totalSeats, 48);
  const seatGrid = Array.from({ length: seatsToShow }, (_, i) => {
    const num = i + 1;
    const isOcc = activeBookings.some(b => String(b.seat) === String(num));
    const isExp = pendingBookings.some(b => String(b.seat) === String(num));
    // Fallback pattern when no real data
    const fallbackOcc = !currentBookings.length && num % 3 !== 0 && num !== 5 && num !== 16;
    const fallbackExp = !currentBookings.length && (num === 5 || num === 16);
    return {
      num,
      label: String(num),  // Simple number: 1, 2, 3...
      status: isExp || fallbackExp ? 'exp' : (isOcc || fallbackOcc) ? 'occ' : 'free'
    };
  });

  const dummyStudents = {
    active: [
      { _id: 'd1', student: { name: 'Ravi Agarwal' }, seat: 'A4', shift: 'Evening' },
      { _id: 'd2', student: { name: 'Aman Sharma' }, seat: 'C2', shift: 'Morning' },
      { _id: 'd3', student: { name: 'Priya Verma' }, seat: 'D6', shift: 'Full Time' },
    ],
    pending: [
      { _id: 'p1', student: { name: 'Priya Sharma' }, seat: 'B5', shift: 'Evening' },
    ]
  };

  const displayActive = activeBookings.length > 0 ? activeBookings.slice(0, 3) : dummyStudents.active;
  const displayPending = pendingBookings.length > 0 ? pendingBookings.slice(0, 1) : dummyStudents.pending;

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
              <Text style={s.greeting}>Good morning, {ownerData?.name?.split(' ')[0] || 'Ramesh'} 👋</Text>
              <Text style={s.libName} numberOfLines={1}>{currentLibrary?.name || 'Gyan Deep Library'}</Text>
            </View>
          </View>
        </View>

        {/* ── 2×2 STATS GRID ── */}
        <View style={s.gridRow}>
          {/* Revenue - Highlighted + tappable to Reports */}
          <TouchableOpacity style={[s.card, s.cardHL]} onPress={() => router.push('/owner/reports')} activeOpacity={0.85}>
            <Text style={s.cardLabelHL}>{"Today's Revenue"}</Text>
            <Text style={s.cardValHL}>₹{todayRevenue.toLocaleString('en-IN')}</Text>
            <View style={s.revenueLink}>
              <Text style={s.revenueLinkTxt}>View Full Report</Text>
              <Ionicons name="arrow-forward" size={11} color={C.primary} />
            </View>
          </TouchableOpacity>
          {/* Seats */}
          <TouchableOpacity style={s.card} onPress={() => router.push('/owner/seat-manager')}>
            <Text style={s.cardLabel}>Seats Occupied</Text>
            <Text style={s.cardVal}>
              {occupiedCount}<Text style={s.cardValSub}>/{totalSeats}</Text>
            </Text>
            <Text style={s.cardSubTeal}>{occupancy}% Occupancy</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.gridRow, { marginBottom: 16 }]}>
          {/* Due */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Due Payments</Text>
            <Text style={[s.cardVal, { color: C.red }]}>{pendingBookings.length || 3}</Text>
            <Text style={[s.cardSubTeal, { color: C.red }]}>Action Required</Text>
          </View>
          {/* New Inquiries */}
          <View style={s.card}>
            <Text style={s.cardLabel}>New Inquiries</Text>
            <Text style={s.cardVal}>7</Text>
            <Text style={s.cardSubTeal}>via LibConnect</Text>
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
                <View key={seat.num} style={[s.seat, bg]}>
                  <Text style={[s.seatTxt, { color: tc }]}>{seat.label}</Text>
                </View>
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
          <Text style={s.secTitle}>{"Today's Students"}</Text>
          <TouchableOpacity onPress={() => router.push('/owner/tabs/students')}>
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
              <Text style={s.stMeta}>Seat {st.seat} · {st.shift} · 3 May</Text>
            </View>
            <View style={[s.chip, { backgroundColor: C.chip.green.bg, borderColor: C.chip.green.border }]}>
              <Text style={[s.chipTxt, { color: C.chip.green.text }]}>Active</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>
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
  revenueLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  revenueLinkTxt: { color: C.primary, fontSize: 12, fontWeight: '700' },

  // Shift revenue breakdown
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  shiftLbl: { width: 72, fontSize: 12, fontWeight: '600', color: C.textGray },
  shiftTrack: { flex: 1, height: 9, backgroundColor: '#EEE', borderRadius: 5, overflow: 'hidden' },
  shiftFill: { height: 9, borderRadius: 5, minWidth: 3 },
  shiftAmt: { width: 72, fontSize: 13, fontWeight: '700', color: C.textGray, textAlign: 'right' },

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
});
