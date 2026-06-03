import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Linking, Modal, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useApp } from '../../../src/context/AppContext';
import { ownerAddStudent } from '../../../src/services/bookingService';
import { API_ENDPOINTS } from '../../../src/services/apiConfig';

const { width } = Dimensions.get('window');

// ── Design Colors ──
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
  orange: '#C2410C',
  orangeLight: '#FFF3E8',
  orangeBorder: '#FDDCBB',
};

const DUMMY = [
  { _id: '1', student: { name: 'Aman Sharma',  phone: '9876543210' }, seat: '12', shift: 'Full Time', status: 'Active',  endDate: '6/10/2026', fee: 1000 },
  { _id: '2', student: { name: 'Priya Verma',  phone: '9123456789' }, seat: '5',  shift: 'Half Time', status: 'Pending', endDate: '1/1/2026',  fee: 600  },
  { _id: '3', student: { name: 'Rahul Joshi',  phone: '9988776655' }, seat: '18', shift: 'Full Time', status: 'Active',  endDate: '5/4/2026',  fee: 1000 },
];

const FILTERS = ['All', 'Active', 'Due', 'Expired'];

const getChip = (status, isSoon) => {
  if (status === 'Active' && isSoon)
    return { label: 'Expiring Soon', bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
  switch (status) {
    case 'Active':  return { label: 'Active',   bg: '#DCFCE7', border: '#86EFAC', text: '#166534' };
    case 'Pending': return { label: 'Fee Due',  bg: '#FEE2E2', border: '#FCA5A5', text: C.red };
    case 'Expired': return { label: 'Expired',  bg: C.orangeLight, border: C.orangeBorder, text: C.orange };
    case 'New':     return { label: 'New',      bg: C.primaryLight, border: C.primaryBorder, text: C.primary };
    default:        return { label: status,     bg: '#F1EFE8', border: '#D3D1C7', text: '#888' };
  }
};

export default function StudentsTab() {
  const router = useRouter();
  const { seat } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { currentBookings, currentLibrary, fetchDashboardData, loading, addRevenueEntry } = useApp();

  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');
  const [addModal, setAddModal]     = useState(false);
  const [payModal, setPayModal]     = useState(false);
  const [selStudent, setSelStudent] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ name: '', phone: '', seat: '', plan: 'Full Time' });
  const [payForm, setPayForm]       = useState({ amount: '', method: 'UPI' });

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    if (seat) {
      setForm(prev => ({ ...prev, seat: String(seat) }));
      setAddModal(true);
    }
  }, [seat]);

  const today = new Date();
  const soon  = new Date(); soon.setDate(today.getDate() + 3);

  const rawList = useMemo(() =>
    (currentBookings.length > 0 ? currentBookings : DUMMY).map(b => {
      const exp = new Date(b.endDate);
      const isDue  = exp < today;
      const isSoon = !isDue && exp <= soon;
      const fee = b.fee || (b.shift === 'Half Time' ? currentLibrary?.halfTime?.fee : currentLibrary?.fullTime?.fee) || 0;
      return { ...b, student: b.student || { name: 'Student', phone: '' }, isDue, isSoon, fee };
    }), [currentBookings, currentLibrary]);

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'S';

  // Summary stats
  const totalCollected = rawList.filter(s => s.status === 'Active' && !s.isDue).reduce((a, s) => a + (s.fee || 0), 0);
  const totalPending   = rawList.filter(s => s.isDue || s.status === 'Pending').reduce((a, s) => a + (s.fee || 0), 0);

  const filtered = useMemo(() => rawList.filter(st => {
    const q = search.toLowerCase();
    const matchSearch = !q || st.student?.name?.toLowerCase().includes(q) || String(st.seat).includes(q);
    const matchFilter =
      filter === 'All'     ||
      (filter === 'Active'  && st.status === 'Active' && !st.isDue) ||
      (filter === 'Due'     && (st.status === 'Pending' || st.isDue)) ||
      (filter === 'Expired' && st.status === 'Expired');
    return matchSearch && matchFilter;
  }), [rawList, search, filter]);

  // Add student
  const handleAdd = async () => {
    if (!form.name || !form.phone || !form.seat) {
      Alert.alert('Missing Fields', 'Please fill Name, Phone and Seat.'); return;
    }
    setSaving(true);
    try {
      await ownerAddStudent({ name: form.name, phone: form.phone, seat: form.seat, shift: form.plan, libraryId: currentLibrary?._id });
      // Auto-add income entry to revenue when new student joins
      const joinFee = form.plan === 'Half Time'
        ? (currentLibrary?.halfTime?.fee || 600)
        : (currentLibrary?.fullTime?.fee || 1000);
      await addRevenueEntry({
        type: 'income',
        category: 'student_fee',
        amount: joinFee,
        shift: form.plan,
        studentName: form.name,
        method: 'Cash',
        note: `New student joined — Seat ${form.seat}`,
      });
      fetchDashboardData();
      setAddModal(false);
      setForm({ name: '', phone: '', seat: '', plan: 'Full Time' });
      Alert.alert('✅ Done!', 'Student added successfully.');
    } catch (e) { Alert.alert('Error', e.message || 'Could not add student.'); }
    finally { setSaving(false); }
  };

  // Collect payment
  const openPay = (st) => {
    setSelStudent(st);
    setPayForm({ amount: String(st.fee || ''), method: 'UPI' });
    setPayModal(true);
  };
  const handleCollect = async () => {
    if (!payForm.amount) { Alert.alert('Error', 'Enter amount.'); return; }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Try backend first, fallback gracefully if offline
      try {
        await axios.post(API_ENDPOINTS.PAYMENTS, {
          bookingId: selStudent._id, amount: parseInt(payForm.amount, 10), method: payForm.method,
        }, { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 });
      } catch (backendErr) {
        console.warn('Backend payment save failed (offline?), continuing locally:', backendErr.message);
      }
      // Auto-add income entry to revenue — always runs even if backend is offline
      await addRevenueEntry({
        type: 'income',
        category: 'due_collection',
        amount: parseInt(payForm.amount, 10),
        shift: selStudent?.shift || null,
        studentName: selStudent?.student?.name || null,
        studentId: selStudent?._id || null,
        method: payForm.method,
        note: `Fee collected — Seat ${selStudent?.seat || ''}`,
      });
      setPayModal(false);
      fetchDashboardData();
      Alert.alert('✅ Payment Recorded!', `₹${payForm.amount} via ${payForm.method} saved.`);
    } catch (e) { Alert.alert('Error', e.response?.data?.message || e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  // WhatsApp
  const sendWA = (phone, name, fee) => {
    const msg = `Hi ${name}, your library fee of ₹${fee} is due. Please pay to continue.`;
    Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Students</Text>
            <Text style={s.subtitle}>{rawList.length} Total Enrolled</Text>
          </View>
        </View>

        {/* ── 3 SUMMARY BOXES ── */}
        <View style={s.summaryRow}>
          <View style={s.sumCard}>
            <Text style={s.sumLabel}>Total</Text>
            <Text style={s.sumVal}>{rawList.length}</Text>
            <Text style={s.sumSub}>Students</Text>
          </View>
          <View style={[s.sumCard, { backgroundColor: C.primaryLight, borderColor: C.primaryBorder }]}>
            <Text style={[s.sumLabel, { color: '#085041' }]}>Collected</Text>
            <Text style={[s.sumVal, { color: C.primary }]}>₹{totalCollected.toLocaleString('en-IN')}</Text>
            <Text style={[s.sumSub, { color: C.primary }]}>This month</Text>
          </View>
          <View style={[s.sumCard, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
            <Text style={[s.sumLabel, { color: '#991B1B' }]}>Pending</Text>
            <Text style={[s.sumVal, { color: C.red }]}>₹{totalPending.toLocaleString('en-IN')}</Text>
            <Text style={[s.sumSub, { color: C.red }]}>Due</Text>
          </View>
        </View>

        {/* ── SEARCH ── */}
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={17} color={C.textGray} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name or seat..."
            placeholderTextColor={C.textGray}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={C.textGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── FILTER TABS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
          {FILTERS.map(f => {
            const cnt = f === 'All' ? rawList.length
              : f === 'Active'  ? rawList.filter(s => s.status === 'Active' && !s.isDue).length
              : f === 'Due'     ? rawList.filter(s => s.isDue || s.status === 'Pending').length
              : rawList.filter(s => s.status === 'Expired').length;
            return (
              <TouchableOpacity key={f} style={[s.fChip, filter === f && s.fChipActive]} onPress={() => setFilter(f)} activeOpacity={0.8}>
                <Text style={[s.fChipTxt, filter === f && s.fChipTxtActive]}>{f} {cnt}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── STUDENT CARDS ── */}
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color={C.border} />
            <Text style={s.emptyTxt}>No students found</Text>
          </View>
        ) : filtered.map(st => {
          const chip = getChip(st.status, st.isSoon);
          const isDue = st.isDue || st.status === 'Pending';
          const exp = new Date(st.endDate);
          const expStr = isNaN(exp) ? st.endDate : exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
          return (
            <TouchableOpacity
              key={st._id}
              activeOpacity={0.95}
              onPress={() => router.push({
                pathname: '/owner/student-profile',
                params: {
                  id: st._id, name: st.student?.name || 'Student',
                  phone: st.student?.phone || '', seat: st.seat,
                  shift: st.shift, status: st.status,
                  endDate: st.endDate || '', fee: st.fee || 0,
                }
              })}
            >
            <View style={[s.card, isDue && s.cardRed]}>
              {/* Card Top */}
              <View style={s.cardTop}>
                <View style={[s.ava, isDue && { backgroundColor: '#FCA5A5' }]}>
                  <Text style={[s.avaTxt, isDue && { color: C.red }]}>{getInitials(st.student?.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stName}>{st.student?.name}</Text>
                  <Text style={s.stPhone}>{st.student?.phone}</Text>
                </View>
                {/* Status chip */}
                <View style={[s.chip, { backgroundColor: chip.bg, borderColor: chip.border }]}>
                  <Text style={[s.chipTxt, { color: chip.text }]}>{chip.label}</Text>
                </View>
              </View>

              {/* Info strip: Seat · Exp · Shift */}
              <View style={s.infoStrip}>
                <View style={s.infoItem}>
                  <Ionicons name="location-outline" size={12} color={C.textGray} />
                  <Text style={s.infoTxt}>Seat {st.seat}</Text>
                </View>
                <View style={s.infoItem}>
                  <Ionicons name="calendar-outline" size={12} color={C.textGray} />
                  <Text style={s.infoTxt}>Exp: {expStr}</Text>
                </View>
                <View style={s.infoItem}>
                  <Ionicons name="time-outline" size={12} color={C.textGray} />
                  <Text style={s.infoTxt}>{st.shift}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={s.actionRow}>
                {/* Collect Fee — only for Due/Expired/Expiring */}
                {(isDue || st.status === 'Expired' || st.isSoon) ? (
                  <TouchableOpacity style={s.collectBtn} onPress={() => openPay(st)} activeOpacity={0.85}>
                    <Ionicons name="cash-outline" size={14} color="#FFF" />
                    <Text style={s.collectBtnTxt}>Collect ₹{(st.fee || 0).toLocaleString('en-IN')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={s.paidTag}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#16A34A" />
                    <Text style={s.paidTxt}>Fee Paid</Text>
                  </View>
                )}

                {/* WhatsApp — SABKE LIYE, alag message */}
                <TouchableOpacity
                  style={s.waBtn}
                  onPress={() => {
                    const name = st.student?.name || 'Student';
                    const phone = st.student?.phone || '';
                    const fee = st.fee || 0;
                    let msg = '';
                    if (isDue || st.status === 'Expired') {
                      msg = `Hi ${name}, aapka library seat ka fee ₹${fee} due hai. Please jaldi renew karein. - Library`;
                    } else if (st.isSoon) {
                      msg = `Hi ${name}, aapka library seat 3 dino mein expire hone wala hai. Please renew karein. - Library`;
                    } else {
                      msg = `Hi ${name}, aapka library seat active hai. Koi bhi help ke liye humse contact karein. - Library`;
                    }
                    Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={15} color="#16A34A" />
                </TouchableOpacity>

                {/* Delete — always */}
                <TouchableOpacity
                  style={s.delBtn}
                  onPress={() => Alert.alert('Remove Student', 'Are you sure you want to remove this student?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => {} }
                  ])}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={15} color={C.red} />
                </TouchableOpacity>
              </View>
            </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FLOATING ACTION BUTTON (ADD STUDENT) ── */}
      <TouchableOpacity style={s.fab} onPress={() => setAddModal(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* ── ADD STUDENT MODAL ── */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Add New Student</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close" size={22} color={C.textGray} />
              </TouchableOpacity>
            </View>
            <Text style={s.lbl}>Student Name *</Text>
            <TextInput style={s.inp} placeholder="Full name" placeholderTextColor={C.textGray} value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />
            <Text style={s.lbl}>Phone Number *</Text>
            <TextInput style={s.inp} placeholder="10-digit mobile" placeholderTextColor={C.textGray} keyboardType="phone-pad" maxLength={10} value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} />
            <Text style={s.lbl}>Seat Number *</Text>
            <TextInput style={s.inp} placeholder="e.g. 12 or A4" placeholderTextColor={C.textGray} value={form.seat} onChangeText={v => setForm(p => ({ ...p, seat: v }))} />
            <Text style={s.lbl}>Shift / Plan</Text>
            <View style={s.planRow}>
              {['Full Time', 'Morning', 'Evening'].map(p => (
                <TouchableOpacity key={p} style={[s.planChip, form.plan === p && s.planChipAct]} onPress={() => setForm(prev => ({ ...prev, plan: p }))}>
                  <Text style={[s.planChipTxt, form.plan === p && { color: '#FFF' }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={handleAdd} activeOpacity={0.85} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Add Student</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── COLLECT PAYMENT MODAL ── */}
      <Modal visible={payModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Collect Payment</Text>
              <TouchableOpacity onPress={() => setPayModal(false)}>
                <Ionicons name="close" size={22} color={C.textGray} />
              </TouchableOpacity>
            </View>
            <Text style={s.lbl}>Amount (₹)</Text>
            <TextInput style={s.inp} placeholder="Enter amount" placeholderTextColor={C.textGray} keyboardType="numeric" value={payForm.amount} onChangeText={v => setPayForm(p => ({ ...p, amount: v }))} />
            <Text style={s.lbl}>Payment Method</Text>
            <View style={s.planRow}>
              {['UPI', 'Cash', 'Online'].map(m => (
                <TouchableOpacity key={m} style={[s.planChip, payForm.method === m && s.planChipAct]} onPress={() => setPayForm(p => ({ ...p, method: m }))}>
                  <Text style={[s.planChipTxt, payForm.method === m && { color: '#FFF' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={handleCollect} activeOpacity={0.85} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Record Payment</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: C.textDark, fontSize: 22, fontWeight: '700' },
  subtitle: { color: C.textGray, fontSize: 13, fontWeight: '500', marginTop: 2 },
  
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },

  // 3 Summary boxes
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  sumCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, padding: 12, alignItems: 'center' },
  sumLabel: { color: C.textGray, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  sumVal: { color: C.textDark, fontSize: 20, fontWeight: '800' },
  sumSub: { color: C.textGray, fontSize: 10, fontWeight: '500', marginTop: 2 },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15, color: C.textDark, padding: 0 },

  fChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.surface },
  fChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  fChipTxt: { fontSize: 13, fontWeight: '600', color: C.textGray },
  fChipTxtActive: { color: '#FFF' },

  // Student card
  card: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 0.5, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardRed: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  ava: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avaTxt: { fontSize: 15, fontWeight: '700', color: C.primary },
  stName: { color: C.textDark, fontSize: 15, fontWeight: '700' },
  stPhone: { color: C.textGray, fontSize: 12, marginTop: 2 },
  chip: { borderRadius: 10, borderWidth: 0.5, paddingHorizontal: 10, paddingVertical: 5 },
  chipTxt: { fontSize: 11, fontWeight: '700' },

  infoStrip: { flexDirection: 'row', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1EFE8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  infoTxt: { color: C.textDark, fontSize: 12, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  collectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 11 },
  collectBtnTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  paidTag: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, borderWidth: 0.5, borderColor: '#86EFAC' },
  paidTxt: { color: '#166534', fontSize: 13, fontWeight: '700' },
  waBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#DCFCE7', borderWidth: 0.5, borderColor: '#86EFAC', justifyContent: 'center', alignItems: 'center' },
  delBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FEE2E2', borderWidth: 0.5, borderColor: '#FCA5A5', justifyContent: 'center', alignItems: 'center' },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTxt: { color: C.textGray, fontSize: 16, fontWeight: '500' },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: C.textDark, fontSize: 20, fontWeight: '700' },
  lbl: { color: C.textGray, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  inp: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.textDark, marginBottom: 10 },
  planRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  planChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg },
  planChipAct: { backgroundColor: C.primary, borderColor: C.primary },
  planChipTxt: { fontSize: 13, fontWeight: '600', color: C.textGray },
  saveBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
