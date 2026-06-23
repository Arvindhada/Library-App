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
import { sendCustomWhatsApp } from '../../../src/services/whatsapp';

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
  orangeBorder: '#FDBA74',
  green: '#16A34A',
};

const DUMMY = [
  { _id: '1', student: { name: 'Aman Sharma',  phone: '9876543210' }, seat: '12', shift: 'Full Time', status: 'Active',  endDate: '2026-06-10T00:00:00Z', fee: 1000, gender: 'Male', address: '123, Sector 4, Mansarovar, Jaipur', admissionDate: '2026-05-10' },
  { _id: '2', student: { name: 'Priya Verma',  phone: '9123456789' }, seat: '5',  shift: 'Half Time', status: 'Pending', endDate: '2024-01-01T00:00:00Z',  fee: 600, gender: 'Female', address: 'Plot 42, Vaishali Nagar, Jaipur', admissionDate: '2023-12-01'  },
  { _id: '3', student: { name: 'Rahul Joshi',  phone: '9988776655' }, seat: '18', shift: 'Full Time', status: 'Active',  endDate: '2026-05-04T00:00:00Z',  fee: 1000, gender: 'Male', address: 'Tonk Road, Jaipur', admissionDate: '2026-04-04' },
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
  const {
    currentLibrary, currentBookings, setCurrentBookings,
    fetchDashboardData, addRevenueEntry, deleteStudent, collectFee,
  } = useApp();

  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');
  const [addModal, setAddModal]     = useState(false);
  const [isEdit, setIsEdit]         = useState(false);
  const [editId, setEditId]         = useState(null);
  const [payModal, setPayModal]     = useState(false);
  const [selStudent, setSelStudent] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({
    name: '', phone: '', gender: 'Male', address: '', date: new Date().toISOString().split('T')[0],
    seat: '', plan: 'Full Time', isPaid: true
  });
  const [payForm, setPayForm]       = useState({ amount: '', method: 'UPI' });

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    if (seat) {
      setForm(prev => ({ ...prev, seat: String(seat) }));
      setIsEdit(false);
      setEditId(null);
      setAddModal(true);
      router.setParams({ seat: undefined });
    }
  }, [seat]);

  const today = new Date();
  const soon  = new Date(); soon.setDate(today.getDate() + 3);

  const rawList = useMemo(() =>
    currentBookings.map(b => {
      const exp = new Date(b.endDate);
      const isDue  = exp < today;
      const isSoon = !isDue && exp <= soon;
      const isHalfTime = b.shift === 'Half Time' || b.shift === 'Morning' || b.shift === 'Evening';
      const fee = b.fee || (isHalfTime ? currentLibrary?.halfTime?.fee : currentLibrary?.fullTime?.fee) || 0;
      const status = isDue ? 'Expired' : b.status;
      return { ...b, student: b.student || { name: 'Student', phone: '' }, isDue, isSoon, status, fee };
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

  const openAddModal = () => {
    setIsEdit(false);
    setEditId(null);
    setForm({ name: '', phone: '', gender: 'Male', address: '', date: new Date().toISOString().split('T')[0], seat: '', plan: 'Full Time', isPaid: true });
    setAddModal(true);
  };

  const handleEditPress = (st) => {
    setIsEdit(true);
    setEditId(st._id);
    setForm({
      name: st.student?.name || '',
      phone: st.student?.phone || '',
      gender: st.gender || 'Male',
      address: st.address || '',
      date: st.admissionDate ? st.admissionDate.split('T')[0] : (st.createdAt ? st.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      seat: String(st.seat || ''),
      plan: st.shift || 'Full Time',
      isPaid: !st.isDue
    });
    setAddModal(true);
  };

  const handleAdd = async () => {
    if (!form.name || !form.phone || !form.seat) {
      Alert.alert('Missing Fields', 'Please fill Name, Phone and Seat.'); return;
    }
    if (!currentLibrary?._id) {
      Alert.alert('Error', 'Library not found. Please set up your library first.'); return;
    }
    setSaving(true);
    try {
      const d = new Date(form.date);
      if (form.isPaid) d.setDate(d.getDate() + 30);
      else d.setDate(d.getDate() + 2);

      if (isEdit) {
        // Edit: update via backend
        const config = { headers: { Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}` } };
        const res = await axios.put(`${API_ENDPOINTS.BOOKINGS}/${editId}`, {
          seat: form.seat,
          shift: form.plan,
          endDate: d.toISOString(),
          gender: form.gender,
          address: form.address,
          admissionDate: form.date,
          fee: (form.plan === 'Half Time' || form.plan === 'Morning' || form.plan === 'Evening')
            ? (currentLibrary?.halfTime?.fee || currentLibrary?.half_time_fee || 0)
            : (currentLibrary?.fullTime?.fee || currentLibrary?.full_time_fee || 0),
        }, config);
        // Refresh from backend
        await fetchDashboardData();
      } else {
        // Add new student via backend
        await ownerAddStudent({
          name: form.name,
          phone: form.phone,
          seat: form.seat,
          shift: form.plan,
          libraryId: currentLibrary._id,
          gender: form.gender,
          address: form.address,
          admissionDate: form.date,
          isPaid: form.isPaid,
          endDate: d.toISOString(),
          fee: (form.plan === 'Half Time' || form.plan === 'Morning' || form.plan === 'Evening')
            ? (currentLibrary?.halfTime?.fee || currentLibrary?.half_time_fee || 0)
            : (currentLibrary?.fullTime?.fee || currentLibrary?.full_time_fee || 0),
        });

        // If fee paid at admission, also record in revenue
        if (form.isPaid) {
          const isHalfPlan = form.plan === 'Half Time' || form.plan === 'Morning' || form.plan === 'Evening';
          const joinFee = isHalfPlan
            ? (currentLibrary?.halfTime?.fee || currentLibrary?.half_time_fee || 0)
            : (currentLibrary?.fullTime?.fee || currentLibrary?.full_time_fee || 0);
          await addRevenueEntry({
            type: 'income',
            category: 'student_fee',
            amount: joinFee,
            shift: form.plan,
            studentName: form.name,
            method: 'Cash',
            note: `New admission — Seat ${form.seat}`,
          });
        }

        // Refresh to get real backend data
        await fetchDashboardData();
      }

      setAddModal(false);
      setForm({ name: '', phone: '', gender: 'Male', address: '', date: new Date().toISOString().split('T')[0], seat: '', plan: 'Full Time', isPaid: true });
      Alert.alert('✅ Done!', isEdit ? 'Student updated successfully.' : (form.isPaid ? 'Student added (Fee Paid).' : 'Student added on 2-Day Demo.'));
    } catch (e) {
      Alert.alert('Error', e?.message || e?.response?.data?.message || 'Could not save student. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (st) => {
    try {
      const { deleteBooking } = require('../../../src/services/bookingService');
      await deleteBooking(st._id);
    } catch (e) {
      console.warn('Offline or error, deleting locally:', e.message);
    }
    deleteStudent(st._id);
    fetchDashboardData();
    Alert.alert('✅ Removed', `${st.student?.name} has been removed.`);
  };

  // Collect payment
  // Collect payment — use real backend via context
  const openPay = (st) => {
    setSelStudent(st);
    setPayForm({ amount: String(st.fee || ''), method: 'Cash' });
    setPayModal(true);
  };

  const handleCollect = async () => {
    if (!payForm.amount) { Alert.alert('Error', 'Enter amount.'); return; }
    setSaving(true);
    try {
      await collectFee(
        selStudent._id,
        parseInt(payForm.amount, 10),
        payForm.method,
        selStudent?.student?.name,
        selStudent?.shift,
      );
      setPayModal(false);
      Alert.alert(
        '✅ Payment Recorded!',
        `₹${payForm.amount} via ${payForm.method} saved and booking renewed for 30 days.`,
      );
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Payment failed. Check connection.');
    } finally {
      setSaving(false);
    }
  };

  // WhatsApp reminder

  const sendWA = (phone, name, fee) => {
    const msg = `Hi ${name}, your library fee of ₹${fee} is due. Please pay to continue.`;
    Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`);
  };

  if (!currentLibrary) {
    return (
      <View style={[s.safe, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <Ionicons name="business-outline" size={80} color={C.textGray} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: C.textDark, textAlign: 'center', marginBottom: 8 }}>No Library Registered</Text>
        <Text style={{ fontSize: 14, color: C.textGray, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
          Pehle Home tab par jakar apni Library register karein. Uske baad hi aap yahan students add aur manage kar sakenge.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 }}
          onPress={() => router.push('/owner/tabs/home')}
        >
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Go to Home Tab</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
                  gender: st.gender || '', address: st.address || '',
                  admissionDate: st.admissionDate || '',
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

                {/* WhatsApp */}
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
                    sendCustomWhatsApp(phone, msg);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={15} color="#16A34A" />
                </TouchableOpacity>

                {/* Edit & Delete */}
                <TouchableOpacity style={s.editBtn} onPress={() => handleEditPress(st)} activeOpacity={0.8}>
                  <Ionicons name="pencil" size={15} color={C.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.delBtn}
                  onPress={() => Alert.alert('Remove Student', 'Are you sure you want to remove this student?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => handleDelete(st) }
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
      <TouchableOpacity style={s.fab} onPress={openAddModal} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* ── ADD STUDENT MODAL (ADVANCED) ── */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modalBox, { maxHeight: '90%', paddingBottom: 20 }]}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>{isEdit ? 'Edit Student' : 'New Admission'}</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close" size={22} color={C.textGray} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Basic Info */}
              <Text style={s.lbl}>Student Name *</Text>
              <TextInput style={s.inp} placeholder="Full name" placeholderTextColor={C.textGray} value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />
              
              <Text style={s.lbl}>Phone Number *</Text>
              <View style={[s.inp, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}>
                <TextInput style={{ flex: 1, paddingVertical: 13, fontSize: 15, color: C.textDark }} placeholder="10-digit mobile" placeholderTextColor={C.textGray} keyboardType="phone-pad" maxLength={10} value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} />
                {form.phone.length === 10 && <Ionicons name="checkmark-circle" size={20} color={C.green} />}
              </View>

              {/* Gender */}
              <Text style={s.lbl}>Gender</Text>
              <View style={s.planRow}>
                {['Male', 'Female'].map(g => (
                  <TouchableOpacity key={g} style={[s.planChip, form.gender === g && s.planChipAct]} onPress={() => setForm(prev => ({ ...prev, gender: g }))}>
                    <Text style={[s.planChipTxt, form.gender === g && { color: '#FFF' }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Address */}
              <Text style={s.lbl}>Address</Text>
              <TextInput style={[s.inp, { height: 60, textAlignVertical: 'top' }]} placeholder="Full address" placeholderTextColor={C.textGray} multiline value={form.address} onChangeText={v => setForm(p => ({ ...p, address: v }))} />

              {/* Admission Date */}
              <Text style={s.lbl}>Admission Date</Text>
              <TextInput style={s.inp} placeholder="YYYY-MM-DD" placeholderTextColor={C.textGray} value={form.date} onChangeText={v => setForm(p => ({ ...p, date: v }))} />

              {/* Seat & Plan */}
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

              {/* Payment Section */}
              <Text style={s.lbl}>Payment Status</Text>
              {!isEdit ? (
                <View style={s.planRow}>
                  <TouchableOpacity style={[s.planChip, form.isPaid && s.planChipAct]} onPress={() => setForm(p => ({...p, isPaid: true}))}>
                    <Text style={[s.planChipTxt, form.isPaid && { color: '#FFF' }]}>Paid Now (30 Days)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.planChip, !form.isPaid && s.planChipAct]} onPress={() => setForm(p => ({...p, isPaid: false}))}>
                    <Text style={[s.planChipTxt, !form.isPaid && { color: '#FFF' }]}>Free Demo (2 Days)</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ fontSize: 13, color: C.textGray, fontStyle: 'italic', marginBottom: 20 }}>Payment status can be updated via the Collect Fee button.</Text>
              )}

              <TouchableOpacity style={s.saveBtn} onPress={handleAdd} activeOpacity={0.85} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>{isEdit ? 'Save Changes' : (form.isPaid ? 'Add & Record Payment' : 'Start 2-Day Demo')}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── COLLECT PAYMENT MODAL ── */}
      <Modal visible={payModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Collect Payment</Text>
              <TouchableOpacity onPress={() => {
                setPayModal(false);
                setPayForm({ amount: '', method: 'UPI' });
              }}>
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
  editBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 0.5, borderColor: '#BFDBFE', justifyContent: 'center', alignItems: 'center' },
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
  
  // Custom Toggle
  paymentToggleBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 0.5, borderColor: C.border },
  paymentToggleTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4 },
  paymentToggleSub: { fontSize: 12, color: C.textGray, paddingRight: 10 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  
  // Demo Banner
  demoBanner: { flexDirection: 'row', gap: 8, backgroundColor: C.orangeLight, padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 0.5, borderColor: C.orangeBorder },
  demoBannerTxt: { flex: 1, fontSize: 12, color: C.orange, fontWeight: '600', lineHeight: 18 },
});
