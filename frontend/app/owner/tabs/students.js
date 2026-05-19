import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Linking, Modal, Alert, ActivityIndicator, Dimensions, FlatList
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useApp } from '../../../src/context/AppContext';
import { ownerAddStudent, getBookingsByLibrary } from '../../../src/services/bookingService';
import { API_ENDPOINTS } from '../../../src/services/apiConfig';
import SeatBox from '../../../src/components/SeatBox';

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

// Removed DUMMY array

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
  const insets = useSafeAreaInsets();
  const { currentBookings, currentLibrary, fetchDashboardData, loading } = useApp();

  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');
  const params = useLocalSearchParams();
  const [addModal, setAddModal]     = useState(false);
  const [payModal, setPayModal]     = useState(false);
  const [selStudent, setSelStudent] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [seatPanelOpen, setSeatPanelOpen] = useState(true);
  const [form, setForm]             = useState({ 
    name: '', phone: '', 
    seat: params.seat || '', 
    plan: 'Full Day', shift: 'Morning', fee: '' 
  });

  // Handle auto-open if coming from Dashboard "Assign"
  useEffect(() => {
    if (params.autoAdd === 'true') {
      setAddModal(true);
      if (params.seat) setForm(prev => ({ ...prev, seat: params.seat }));
    }
  }, [params.autoAdd, params.seat]);
  const [payForm, setPayForm]       = useState({ amount: '', method: 'UPI' });
  const [localBookings, setLocalBookings] = useState([]);
  const [fetching, setFetching] = useState(false);

  const fetchStudents = async () => {
    if (!currentLibrary?._id) return;
    setFetching(true);
    try {
      const res = await getBookingsByLibrary(currentLibrary._id);
      if (res.success) setLocalBookings(res.bookings);
    } catch (e) {
      console.log('Error fetching students:', e);
    } finally {
      setFetching(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (currentLibrary?._id) {
        fetchStudents();
        fetchDashboardData();
      }
    }, [currentLibrary?._id])
  );

  const todayDate = new Date();
  const soon  = new Date(); soon.setDate(todayDate.getDate() + 3);

  const rawList = useMemo(() =>
    localBookings.map(b => {
      const exp = new Date(b.endDate);
      const isExpired = exp < todayDate;
      const isSoon = !isExpired && exp <= soon;
      const isDue = isExpired || b.paymentStatus !== 'Paid';
      const fee = b.amount || (b.shift === 'Half Time' ? currentLibrary?.half_time_fee : currentLibrary?.full_time_fee) || 0;
      return { ...b, student: b.student || { name: 'Student', phone: '' }, isExpired, isDue, isSoon, fee };
    }), [localBookings, currentLibrary]);

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
      (filter === 'Expired' && st.isExpired);
    return matchSearch && matchFilter;
  }), [rawList, search, filter]);

  // Add student
  const handleAdd = async () => {
    if (!currentLibrary?._id) {
      Alert.alert('No Library', 'Please register your library first on the Dashboard.');
      return;
    }
    if (!form.name || !form.phone || !form.seat) {
      Alert.alert('Missing Fields', 'Please fill Name, Phone and Seat.'); return;
    }
    if (form.phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Phone number must be exactly 10 digits.'); return;
    }
    setSaving(true);
    try {
      await ownerAddStudent({ 
        name: form.name, 
        phone: form.phone, 
        seat: form.seat, 
        shift: form.plan === 'Half Time' ? form.shift : 'Full Day', 
        fee: form.fee ? Number(form.fee) : 0,
        libraryId: currentLibrary?._id 
      });
      fetchDashboardData();
      fetchStudents();
      setAddModal(false);
      setForm({ name: '', phone: '', seat: '', plan: 'Full Day', shift: 'Morning', fee: '' });
      Alert.alert('✅ Done!', 'Student added successfully.');
    } catch (e) { 
      const msg = e.response?.data?.message || e.message || 'Could not add student.';
      Alert.alert('Error', msg); 
    }
    finally { setSaving(false); }
  };

  // Delete booking / remove student
  const handleDelete = (bookingId, studentName) => {
    Alert.alert('Remove Student', `Remove ${studentName}? Their seat will be freed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.delete(`${API_ENDPOINTS.PAYMENTS}/booking/${bookingId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchDashboardData();
            fetchStudents();
            Alert.alert('Done', 'Student removed successfully.');
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not remove student.');
          }
        }
      }
    ]);
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
      await axios.post(`${API_ENDPOINTS.PAYMENTS}/collect`, {
        bookingId: selStudent._id, amount: parseInt(payForm.amount, 10), method: payForm.method,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPayModal(false);
      fetchDashboardData();
      fetchStudents();
      Alert.alert('✅ Payment Recorded!', `₹${payForm.amount} via ${payForm.method} saved. Seat renewed.`);
    } catch (e) { Alert.alert('Error', e.response?.data?.message || e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  // WhatsApp
  const sendWA = (phone, name, fee) => {
    const msg = `Hi ${name}, your library fee of ₹${fee} is due. Please pay to continue.`;
    Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`);
  };

  // ── SEAT MANAGER LIVE DATA ──
  const totalSeats = currentLibrary?.total_seats || 0;
  const today = new Date();
  const seatGrid = useMemo(() => {
    const arr = [];
    const count = totalSeats || 48;
    for (let i = 1; i <= count; i++) {
      const booking = localBookings.find(b => b.status === 'Active' && parseInt(b.seat, 10) === i);
      const isFeeDue = booking ? (new Date(booking.endDate) < today || booking.paymentStatus !== 'Paid') : false;
      arr.push({
        number: i,
        booked: !!booking,
        studentName: booking?.student?.name,
        studentPhone: booking?.student?.phone,
        studentExpiry: booking ? new Date(booking.endDate).toLocaleDateString('en-IN') : null,
        studentPlan: booking?.shift,
        bookingId: booking?._id,
        isFeeDue,
      });
    }
    return arr;
  }, [localBookings, totalSeats]);

  const seatVacant = seatGrid.filter(s => !s.booked).length;
  const seatBooked = seatGrid.filter(s => s.booked).length;
  const seatDue    = seatGrid.filter(s => s.isFeeDue).length;

  const onSeatPress = (seat) => {
    if (seat.booked) {
      const statusText = seat.isFeeDue
        ? `⚠️ Fee Overdue (Expired: ${seat.studentExpiry})`
        : `✅ Active till ${seat.studentExpiry}`;
      Alert.alert(
        `Seat ${seat.number} — ${seat.studentName}`,
        `Plan: ${seat.studentPlan}\n${statusText}`,
        [{ text: 'Close', style: 'cancel' }]
      );
    } else {
      setForm(prev => ({ ...prev, seat: String(seat.number) }));
      setAddModal(true);
    }
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView 
        style={s.scroll} 
        contentContainerStyle={s.content} 
        showsVerticalScrollIndicator={false}
      >

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Manage Students</Text>
            <Text style={s.subtitle}>{rawList.length} Total Enrolled</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setAddModal(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* ── LIVE SEAT MANAGER PANEL ── */}
        <View style={s.seatPanel}>
          {/* Panel Header */}
          <TouchableOpacity
            style={s.seatPanelHeader}
            onPress={() => setSeatPanelOpen(p => !p)}
            activeOpacity={0.85}
          >
            <View style={s.seatPanelTitleRow}>
              <View style={s.seatPanelIcon}>
                <Ionicons name="grid-outline" size={16} color={C.primary} />
              </View>
              <Text style={s.seatPanelTitle}>Live Seat Manager</Text>
              {fetching && <ActivityIndicator size="small" color={C.primary} style={{ marginLeft: 8 }} />}
            </View>
            <Ionicons
              name={seatPanelOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={C.textGray}
            />
          </TouchableOpacity>

          {seatPanelOpen && (
            <>
              {/* Stats Row */}
              <View style={s.seatStats}>
                <View style={[s.seatStatCard, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                  <Text style={[s.seatStatVal, { color: '#166534' }]}>{seatVacant}</Text>
                  <Text style={[s.seatStatLbl, { color: '#16A34A' }]}>Free</Text>
                </View>
                <View style={[s.seatStatCard, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                  <Text style={[s.seatStatVal, { color: C.red }]}>{seatBooked}</Text>
                  <Text style={[s.seatStatLbl, { color: C.red }]}>Booked</Text>
                </View>
                <View style={[s.seatStatCard, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
                  <Text style={[s.seatStatVal, { color: '#92400E' }]}>{seatDue}</Text>
                  <Text style={[s.seatStatLbl, { color: '#B45309' }]}>Fee Due</Text>
                </View>
              </View>

              {/* Legend */}
              <View style={s.seatLegend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: '#22C55E' }]} />
                  <Text style={s.legendTxt}>Free</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={s.legendTxt}>Booked</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={s.legendTxt}>Due</Text>
                </View>
                <Text style={s.seatTotalTxt}>{seatGrid.length} seats</Text>
              </View>

              {/* Grid */}
              <View style={s.seatGrid}>
                <FlatList
                  data={seatGrid}
                  keyExtractor={(_, i) => String(i)}
                  numColumns={8}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <SeatBox
                      seatNumber={item.number}
                      isBooked={item.booked}
                      isFeeDue={item.isFeeDue}
                      onPress={() => onSeatPress(item)}
                    />
                  )}
                />
              </View>
            </>
          )}
        </View>

        {/* ── SEARCH ── */}
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={17} color={C.textGray} />
          <TextInput
            style={s.searchInput}
            placeholder="Student naam ya seat..."
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
        {fetching ? (
          <View style={s.empty}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.emptyTxt}>Loading students...</Text>
          </View>
        ) : filtered.length === 0 ? (
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
                  isDue: String(st.isDue),
                  paymentStatus: st.paymentStatus || 'Pending'
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
                {(isDue || st.isExpired || st.isSoon) ? (
                  <TouchableOpacity style={s.collectBtn} onPress={() => openPay(st)} activeOpacity={0.85}>
                    <Ionicons name="cash-outline" size={14} color="#FFF" />
                    <Text style={s.collectBtnTxt}>Collect ₹{(st.fee || 0).toLocaleString('en-IN')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={s.paidTag}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#16A34A" />
                    <Text style={s.paidTxt}>Fee Received</Text>
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
                    if (isDue || st.isExpired) {
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
                  onPress={() => {
                    handleDelete(st._id, st.student?.name || 'Student');
                  }}
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
            <Text style={s.lbl}>Plan *</Text>
            <View style={s.planRow}>
              {['Full Day', 'Half Time'].map(p => (
                <TouchableOpacity key={p} style={[s.planChip, form.plan === p && s.planChipAct]} onPress={() => setForm(prev => ({ ...prev, plan: p }))}>
                  <Text style={[s.planChipTxt, form.plan === p && { color: '#FFF' }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.plan === 'Half Time' && (
              <>
                <Text style={s.lbl}>Shift *</Text>
                <View style={s.planRow}>
                  {['Morning', 'Evening'].map(sh => (
                    <TouchableOpacity key={sh} style={[s.planChip, form.shift === sh && s.planChipAct]} onPress={() => setForm(p => ({ ...p, shift: sh }))}>
                      <Text style={[s.planChipTxt, form.shift === sh && { color: '#FFF' }]}>{sh}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={s.lbl}>Monthly Fee (₹) *</Text>
            <TextInput style={s.inp} placeholder="e.g. 1000" keyboardType="numeric" value={form.fee} onChangeText={v => setForm({ ...form, fee: v })} />

            <TouchableOpacity style={[s.saveBtn, { marginTop: 10 }]} onPress={handleAdd} activeOpacity={0.85} disabled={saving}>
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
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },

  // ── Seat Manager Panel ──
  seatPanel: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 0.5, borderColor: C.primaryBorder, marginBottom: 16, overflow: 'hidden' },
  seatPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  seatPanelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seatPanelIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  seatPanelTitle: { color: C.textDark, fontSize: 15, fontWeight: '700' },
  seatStats: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  seatStatCard: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  seatStatVal: { fontSize: 22, fontWeight: '800' },
  seatStatLbl: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  seatLegend: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendTxt: { color: C.textGray, fontSize: 11, fontWeight: '600' },
  seatTotalTxt: { marginLeft: 'auto', color: C.textGray, fontSize: 11, fontWeight: '600' },
  seatGrid: { paddingHorizontal: 10, paddingBottom: 14 },

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
