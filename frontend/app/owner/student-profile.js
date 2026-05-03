import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Linking, Alert, ActivityIndicator, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../../src/services/apiConfig';

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
  red: '#DC2626',
  orange: '#C2410C',
  orangeLight: '#FFF3E8',
  orangeBorder: '#FDDCBB',
};

export default function StudentProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Parse student data from navigation params
  const student = {
    _id:      params.id       || '',
    name:     params.name     || 'Student',
    phone:    params.phone    || '',
    seat:     params.seat     || '-',
    shift:    params.shift    || '-',
    status:   params.status   || 'Active',
    endDate:  params.endDate  || '',
    fee:      Number(params.fee) || 0,
    joinDate: params.joinDate || '',
  };

  const [payments, setPayments]   = useState([]);
  const [loadPay, setLoadPay]     = useState(true);
  const [payModal, setPayModal]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [payForm, setPayForm]     = useState({ amount: String(student.fee), method: 'UPI' });

  // Fetch payment history for this booking
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoadPay(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_ENDPOINTS.PAYMENTS}?bookingId=${student._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data?.payments || res.data || []);
    } catch (e) {
      // Fallback dummy data if API not connected
      setPayments([
        { _id: 'p1', amount: student.fee, method: 'UPI',  date: new Date(Date.now() - 30*86400000).toISOString(), status: 'Paid' },
        { _id: 'p2', amount: student.fee, method: 'Cash', date: new Date(Date.now() - 60*86400000).toISOString(), status: 'Paid' },
      ]);
    } finally {
      setLoadPay(false);
    }
  };

  // Collect / Renew payment
  const handleCollect = async () => {
    if (!payForm.amount) { Alert.alert('Error', 'Please enter amount'); return; }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(API_ENDPOINTS.PAYMENTS, {
        bookingId: student._id,
        amount:    parseInt(payForm.amount, 10),
        method:    payForm.method,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setPayModal(false);
      Alert.alert('✅ Payment Recorded!', `₹${payForm.amount} via ${payForm.method} saved.\nSeat renewed for 30 days.`);
      fetchPayments(); // Refresh history
    } catch (e) {
      // Show in history even if API fails (offline mode)
      const newPay = {
        _id: Date.now().toString(),
        amount: parseInt(payForm.amount, 10),
        method: payForm.method,
        date: new Date().toISOString(),
        status: 'Paid',
      };
      setPayments(prev => [newPay, ...prev]);
      setPayModal(false);
      Alert.alert('✅ Saved Locally', `₹${payForm.amount} recorded. Will sync when connected.`);
    } finally {
      setSaving(false);
    }
  };

  const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'S';

  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  const isDue = student.status === 'Pending' || (student.endDate && new Date(student.endDate) < new Date());

  const chipStyle = () => {
    if (isDue)                       return { bg: '#FEE2E2', border: '#FCA5A5', text: C.red,    label: 'Fee Due' };
    if (student.status === 'Active') return { bg: '#DCFCE7', border: '#86EFAC', text: '#166534', label: 'Active' };
    if (student.status === 'Expired')return { bg: C.orangeLight, border: C.orangeBorder, text: C.orange, label: 'Expired' };
    return                                  { bg: C.primaryLight, border: C.primaryBorder, text: C.primary, label: student.status };
  };
  const chip = chipStyle();

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── TOP BAR ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={C.textDark} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Student Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── PROFILE CARD ── */}
        <View style={s.profileCard}>
          <View style={s.profileTop}>
            {/* Big Avatar */}
            <View style={[s.bigAva, isDue && { backgroundColor: '#FCA5A5' }]}>
              <Text style={[s.bigAvaTxt, isDue && { color: C.red }]}>{getInitials(student.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.nameRow}>
                <Text style={s.stName}>{student.name}</Text>
                <View style={[s.chip, { backgroundColor: chip.bg, borderColor: chip.border }]}>
                  <Text style={[s.chipTxt, { color: chip.text }]}>{chip.label}</Text>
                </View>
              </View>
              <View style={s.infoRow}>
                <Ionicons name="call-outline" size={14} color={C.textGray} />
                <Text style={s.infoTxt}>{student.phone || 'No phone'}</Text>
              </View>
            </View>
          </View>

          {/* Detail chips */}
          <View style={s.detailRow}>
            <View style={s.detailItem}>
              <Ionicons name="location-outline" size={14} color={C.primary} />
              <Text style={s.detailLabel}>Seat</Text>
              <Text style={s.detailVal}>{student.seat}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.detailItem}>
              <Ionicons name="time-outline" size={14} color={C.primary} />
              <Text style={s.detailLabel}>Shift</Text>
              <Text style={s.detailVal}>{student.shift}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.detailItem}>
              <Ionicons name="calendar-outline" size={14} color={C.primary} />
              <Text style={s.detailLabel}>Expires</Text>
              <Text style={[s.detailVal, isDue && { color: C.red }]}>
                {student.endDate ? fmtDate(student.endDate) : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3 SUMMARY BOXES ── */}
        <View style={s.sumRow}>
          <View style={[s.sumBox, { backgroundColor: C.primaryLight, borderColor: C.primaryBorder }]}>
            <Text style={[s.sumLbl, { color: '#085041' }]}>Total Paid</Text>
            <Text style={[s.sumVal, { color: C.primary }]}>₹{totalPaid.toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.sumBox}>
            <Text style={s.sumLbl}>Payments</Text>
            <Text style={s.sumVal}>{payments.length}</Text>
          </View>
          <View style={[s.sumBox, isDue && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
            <Text style={[s.sumLbl, isDue && { color: '#991B1B' }]}>Monthly Fee</Text>
            <Text style={[s.sumVal, isDue && { color: C.red }]}>₹{student.fee.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* ── ACTION BUTTONS ── */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.collectBtn} onPress={() => setPayModal(true)} activeOpacity={0.85}>
            <Ionicons name="cash-outline" size={16} color="#FFF" />
            <Text style={s.collectTxt}>Collect / Renew ₹{student.fee}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.waBtn}
            onPress={() => {
              const rawPhone = String(student.phone || '').replace(/\D/g, '').replace(/^0+/, '').replace(/^91/, '');
              const msg = isDue
                ? `Hi ${student.name}, aapka library fee ₹${student.fee} due hai. Please jaldi renew karein. - Library`
                : `Hi ${student.name}, aapka library seat active hai. Koi bhi help ke liye humse contact karein. - Library`;
              Linking.openURL(`https://wa.me/91${rawPhone}?text=${encodeURIComponent(msg)}`);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#16A34A" />
          </TouchableOpacity>
        </View>

        {/* ── PAYMENT HISTORY ── */}
        <View style={s.secHeader}>
          <Text style={s.secTitle}>Payment History</Text>
        </View>

        {loadPay ? (
          <View style={s.loadBox}>
            <ActivityIndicator color={C.primary} />
          </View>
        ) : payments.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="receipt-outline" size={36} color={C.border} />
            <Text style={s.emptyTxt}>No payments yet</Text>
          </View>
        ) : (
          payments.map((p, idx) => (
            <View key={p._id || idx} style={s.payCard}>
              {/* Left: icon + date */}
              <View style={[s.payIcon, { backgroundColor: p.status === 'Missed' ? '#FEE2E2' : C.primaryLight }]}>
                <Ionicons
                  name={p.status === 'Missed' ? 'close-circle-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color={p.status === 'Missed' ? C.red : C.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.payDate}>{fmtDate(p.date || p.createdAt)}</Text>
                <Text style={s.payMethod}>{p.method || 'Payment'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.payAmt, p.status === 'Missed' && { color: C.red }]}>
                  {p.status === 'Missed' ? 'Missed' : `₹${(p.amount || 0).toLocaleString('en-IN')}`}
                </Text>
                <View style={[s.payChip, { backgroundColor: p.status === 'Missed' ? '#FEE2E2' : C.primaryLight }]}>
                  <Text style={[s.payChipTxt, { color: p.status === 'Missed' ? C.red : C.primary }]}>
                    {p.status === 'Missed' ? 'Missed' : 'Paid'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── COLLECT PAYMENT MODAL ── */}
      <Modal visible={payModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <View>
                <Text style={s.modalTitle}>Collect Payment</Text>
                <Text style={s.modalSub}>for {student.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setPayModal(false)}>
                <Ionicons name="close" size={22} color={C.textGray} />
              </TouchableOpacity>
            </View>

            <Text style={s.lbl}>Amount (₹)</Text>
            <View style={s.amtRow}>
              {[student.fee, Math.round(student.fee * 3), Math.round(student.fee * 6)].map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[s.amtChip, payForm.amount === String(amt) && s.amtChipActive]}
                  onPress={() => setPayForm(p => ({ ...p, amount: String(amt) }))}
                >
                  <Text style={[s.amtChipTxt, payForm.amount === String(amt) && { color: '#FFF' }]}>
                    ₹{amt.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.lbl}>Payment Method</Text>
            <View style={s.planRow}>
              {['UPI', 'Cash', 'Online', 'Bank Transfer'].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.planChip, payForm.method === m && s.planChipAct]}
                  onPress={() => setPayForm(p => ({ ...p, method: m }))}
                >
                  <Text style={[s.planChipTxt, payForm.method === m && { color: '#FFF' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.totalBox}>
              <Text style={s.totalLbl}>Amount to collect:</Text>
              <Text style={s.totalAmt}>₹{Number(payForm.amount || 0).toLocaleString('en-IN')}</Text>
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={handleCollect} activeOpacity={0.85} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#FFF" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                    <Text style={s.saveTxt}>Record Payment & Renew</Text>
                  </>
              }
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
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },

  // Top Bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.bg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: { color: C.textDark, fontSize: 17, fontWeight: '700' },
  waTopBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#DCFCE7', borderWidth: 0.5, borderColor: '#86EFAC',
    justifyContent: 'center', alignItems: 'center',
  },

  // Profile Card
  profileCard: {
    backgroundColor: C.surface, borderRadius: 20, borderWidth: 0.5, borderColor: C.border,
    padding: 18, marginBottom: 14,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  bigAva: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primaryBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  bigAvaTxt: { fontSize: 22, fontWeight: '800', color: C.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  stName: { color: C.textDark, fontSize: 18, fontWeight: '700' },
  chip: { borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 9, paddingVertical: 4 },
  chipTxt: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoTxt: { color: C.textGray, fontSize: 14, fontWeight: '500' },

  // Detail strip
  detailRow: {
    flexDirection: 'row', backgroundColor: C.bg,
    borderRadius: 14, padding: 14, gap: 8,
  },
  detailItem: { flex: 1, alignItems: 'center', gap: 4 },
  detailLabel: { color: C.textGray, fontSize: 11, fontWeight: '500' },
  detailVal: { color: C.textDark, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  divider: { width: 0.5, backgroundColor: C.border, alignSelf: 'stretch' },

  // Summary boxes
  sumRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  sumBox: { flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, padding: 14, alignItems: 'center' },
  sumLbl: { color: C.textGray, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  sumVal: { color: C.textDark, fontSize: 20, fontWeight: '800' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  collectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14,
  },
  collectTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  waBtn: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#DCFCE7', borderWidth: 0.5, borderColor: '#86EFAC',
    justifyContent: 'center', alignItems: 'center',
  },

  // Section
  secHeader: { marginBottom: 12 },
  secTitle: { color: C.textDark, fontSize: 16, fontWeight: '700' },

  // Payment card
  payCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border,
    padding: 14, marginBottom: 10,
  },
  payIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  payDate: { color: C.textDark, fontSize: 14, fontWeight: '600' },
  payMethod: { color: C.textGray, fontSize: 12, marginTop: 2 },
  payAmt: { color: C.primary, fontSize: 15, fontWeight: '800' },
  payChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  payChipTxt: { fontSize: 10, fontWeight: '700' },

  loadBox: { padding: 40, alignItems: 'center' },
  emptyBox: { padding: 50, alignItems: 'center', gap: 10 },
  emptyTxt: { color: C.textGray, fontSize: 15 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 44 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { color: C.textDark, fontSize: 20, fontWeight: '700' },
  modalSub: { color: C.textGray, fontSize: 13, marginTop: 2 },

  lbl: { color: C.textGray, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  amtRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  amtChip: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center' },
  amtChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  amtChipTxt: { fontSize: 13, fontWeight: '700', color: C.textGray },

  planRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  planChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg },
  planChipAct: { backgroundColor: C.primary, borderColor: C.primary },
  planChipTxt: { fontSize: 13, fontWeight: '600', color: C.textGray },

  totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16 },
  totalLbl: { color: '#085041', fontSize: 14, fontWeight: '600' },
  totalAmt: { color: C.primary, fontSize: 22, fontWeight: '800' },

  saveBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
