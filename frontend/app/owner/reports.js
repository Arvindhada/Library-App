import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert, Linking,
  StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';

const { width } = Dimensions.get('window');

// ── Brand Colors ──
const C = {
  bg: '#F5F3EE',
  surface: '#FFFFFF',
  primary: '#0F6E56',
  primaryDark: '#085041',
  primaryLight: '#E8F5F0',
  primaryBorder: '#9FE1CB',
  textDark: '#1A1C1B',
  textGray: '#6F7A74',
  border: '#D1CFCA',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenBorder: '#86EFAC',
  red: '#DC2626',
  redLight: '#FEE2E2',
  redBorder: '#FCA5A5',
  orange: '#C2410C',
  orangeLight: '#FFF3E8',
  orangeBorder: '#FDDCBB',
  amber: '#D97706',
  amberLight: '#FEF3C7',
};

// ── Helpers ──
const toDateStr = (d) => d.toISOString().split('T')[0]; // 'YYYY-MM-DD'

const getWeekDates = (anchorDate) => {
  // Returns array of 7 Date objects for Mon–Sun of the week containing anchorDate
  const d = new Date(anchorDate);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon);
    dd.setDate(mon.getDate() + i);
    return dd;
  });
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const EXPENSE_CATEGORIES = [
  { key: 'rent',        label: 'Rent',        icon: 'home-outline',         color: '#7C3AED' },
  { key: 'electricity', label: 'Electricity', icon: 'flash-outline',         color: C.amber },
  { key: 'wifi',        label: 'WiFi',        icon: 'wifi-outline',          color: '#2563EB' },
  { key: 'cleaning',   label: 'Cleaning',    icon: 'sparkles-outline',      color: '#0891B2' },
  { key: 'other',      label: 'Other',       icon: 'ellipsis-horizontal',   color: C.textGray },
];

export default function OwnerReports() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentBookings, currentLibrary, revenueTransactions, addRevenueEntry, loadRevenueData, loading } = useApp();

  // ── Week navigator state ──
  const [weekAnchor, setWeekAnchor] = useState(new Date()); // any date in the current week
  const [selectedDay, setSelectedDay] = useState(toDateStr(new Date()));

  // ── Month navigator (for month stats) ──
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = last month, etc.

  // ── Expense modal ──
  const [expModal, setExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ amount: '', category: 'rent', method: 'Cash', note: '' });
  const [expSaving, setExpSaving] = useState(false);

  // ── Day detail modal ──
  const [dayModal, setDayModal] = useState(false);

  useEffect(() => { loadRevenueData(); }, []);

  const onRefresh = useCallback(() => { loadRevenueData(); }, []);

  // ── Current month being viewed ──
  const viewingDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const viewingMonth = viewingDate.getMonth();
  const viewingYear = viewingDate.getFullYear();

  // ── Revenue transactions for the viewed month ──
  const monthTransactions = useMemo(() =>
    revenueTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === viewingMonth && d.getFullYear() === viewingYear;
    }), [revenueTransactions, viewingMonth, viewingYear]);

  const monthIncome = useMemo(() =>
    monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]);

  const monthExpense = useMemo(() =>
    monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]);

  const netProfit = monthIncome - monthExpense;

  // Days in the viewed month
  const daysInMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();
  const dailyAvg = daysInMonth > 0 ? Math.round(monthIncome / daysInMonth) : 0;

  // ── Week dates ──
  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);

  const goNextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };
  const goPrevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };

  // Week label e.g. "2–8 Jun 2026"
  const weekLabel = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[6];
    const sameMonth = first.getMonth() === last.getMonth();
    const monthShort = (d) => MONTH_NAMES[d.getMonth()].slice(0, 3);
    if (sameMonth) {
      return `${first.getDate()}–${last.getDate()} ${monthShort(first)} ${first.getFullYear()}`;
    }
    return `${first.getDate()} ${monthShort(first)} – ${last.getDate()} ${monthShort(last)} ${last.getFullYear()}`;
  }, [weekDates]);

  // ── Revenue per day in current week ──
  const weekRevenue = useMemo(() =>
    weekDates.map(d => {
      const ds = toDateStr(d);
      const dayTxns = revenueTransactions.filter(t => t.date === ds && t.type === 'income');
      return { date: ds, amount: dayTxns.reduce((s, t) => s + t.amount, 0), transactions: dayTxns };
    }), [weekDates, revenueTransactions]);

  const maxWeekVal = useMemo(() => Math.max(...weekRevenue.map(d => d.amount), 1), [weekRevenue]);

  // ── Selected day data ──
  const selectedDayData = useMemo(() =>
    weekRevenue.find(d => d.date === selectedDay) || { date: selectedDay, amount: 0, transactions: [] },
    [weekRevenue, selectedDay]);

  // ── Shift breakdown for the viewed month ──
  const shiftBreakdown = useMemo(() => {
    const shifts = ['Full Time', 'Morning', 'Evening'];
    const totals = {};
    shifts.forEach(s => { totals[s] = 0; });
    monthTransactions.filter(t => t.type === 'income' && t.shift).forEach(t => {
      if (totals[t.shift] !== undefined) totals[t.shift] += t.amount;
    });
    const maxVal = Math.max(...Object.values(totals), 1);
    return shifts.map(s => ({ shift: s, amount: totals[s], pct: totals[s] / maxVal }));
  }, [monthTransactions]);

  const shiftColors = {
    'Full Time': C.primary,
    'Morning':   '#E05C2E',
    'Evening':   '#0891B2',
  };

  // ── Due collections from bookings ──
  const today = new Date();
  const overdueStudents = useMemo(() =>
    currentBookings.filter(b => {
      const exp = new Date(b.endDate);
      return exp < today && b.status !== 'Inactive';
    }).map(b => {
      const exp = new Date(b.endDate);
      const daysOverdue = Math.floor((today - exp) / (1000 * 60 * 60 * 24));
      const fee = b.shift === 'Half Time'
        ? (currentLibrary?.halfTime?.fee || 600)
        : (currentLibrary?.fullTime?.fee || 1000);
      return { ...b, daysOverdue, fee };
    }), [currentBookings, currentLibrary]);

  const totalDues = overdueStudents.reduce((s, b) => s + b.fee, 0);

  // ── WhatsApp reminder ──
  const sendWhatsApp = (b) => {
    const name = b.student?.name || 'Student';
    const phone = b.student?.phone || '';
    const fee = b.fee;
    const msg = `Hi ${name}, your library seat #${b.seat} fee of ₹${fee} is overdue by ${b.daysOverdue} day(s). Please renew to continue using your seat. Thank you! — Library Management`;
    Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`);
  };

  // Collect due payment inline
  const [collectModal, setCollectModal] = useState(false);
  const [collectStudent, setCollectStudent] = useState(null);
  const [collectForm, setCollectForm] = useState({ amount: '', method: 'UPI' });
  const [collectSaving, setCollectSaving] = useState(false);

  const openCollect = (b) => {
    setCollectStudent(b);
    setCollectForm({ amount: String(b.fee), method: 'UPI' });
    setCollectModal(true);
  };

  const handleCollect = async () => {
    if (!collectForm.amount) { Alert.alert('Error', 'Enter amount'); return; }
    setCollectSaving(true);
    try {
      await addRevenueEntry({
        type: 'income',
        category: 'due_collection',
        amount: parseInt(collectForm.amount, 10),
        shift: collectStudent?.shift || null,
        studentName: collectStudent?.student?.name || null,
        studentId: collectStudent?._id || null,
        method: collectForm.method,
        note: `Due collected — Seat ${collectStudent?.seat || ''}`,
      });
      setCollectModal(false);
      Alert.alert('✅ Collected!', `₹${collectForm.amount} recorded in revenue.`);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setCollectSaving(false);
    }
  };

  // ── Add Expense ──
  const handleAddExpense = async () => {
    if (!expForm.amount || isNaN(Number(expForm.amount)) || Number(expForm.amount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount.'); return;
    }
    setExpSaving(true);
    try {
      await addRevenueEntry({
        type: 'expense',
        category: expForm.category,
        amount: parseInt(expForm.amount, 10),
        method: expForm.method,
        note: expForm.note || EXPENSE_CATEGORIES.find(c => c.key === expForm.category)?.label || 'Expense',
      });
      setExpModal(false);
      setExpForm({ amount: '', category: 'rent', method: 'Cash', note: '' });
      Alert.alert('✅ Expense Added!', `₹${expForm.amount} expense recorded.`);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setExpSaving(false);
    }
  };

  const formatAmount = (n) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={C.textDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Revenue Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />}
      >

        {/* ── MONTH NAVIGATOR ── */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={() => setMonthOffset(o => o - 1)} style={s.navArrow} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.monthLabel}>
            {MONTH_NAMES[viewingMonth]} {viewingYear}
          </Text>
          <TouchableOpacity
            onPress={() => { if (monthOffset < 0) setMonthOffset(o => o + 1); }}
            style={[s.navArrow, monthOffset >= 0 && { opacity: 0.3 }]}
            activeOpacity={0.7}
            disabled={monthOffset >= 0}
          >
            <Ionicons name="chevron-forward" size={18} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* ── TOP STATS ROW ── */}
        <View style={s.statsRow}>
          {/* This month total */}
          <View style={[s.statCard, s.statCardTeal]}>
            <Text style={s.statLabelTeal}>This Month Total</Text>
            <Text style={s.statValTeal}>{formatAmount(monthIncome)}</Text>
            <Text style={s.statSubTeal}>
              {monthOffset === 0 ? '↑ vs last month' : MONTH_NAMES[viewingMonth].slice(0, 3) + ' ' + viewingYear}
            </Text>
          </View>
          {/* Daily average */}
          <View style={s.statCard}>
            <Text style={s.statLabel}>Daily Average</Text>
            <Text style={s.statVal}>{formatAmount(dailyAvg)}</Text>
            <Text style={s.statSub}>in {daysInMonth} days</Text>
          </View>
        </View>

        {/* ── INCOME / EXPENSE / NET ── */}
        <View style={s.statsRow}>
          <View style={[s.miniCard, { backgroundColor: C.greenLight, borderColor: C.greenBorder }]}>
            <Text style={s.miniLabel}>Income</Text>
            <Text style={[s.miniVal, { color: C.green }]}>+{formatAmount(monthIncome)}</Text>
          </View>
          <View style={[s.miniCard, { backgroundColor: C.orangeLight, borderColor: C.orangeBorder }]}>
            <Text style={s.miniLabel}>Expenses</Text>
            <Text style={[s.miniVal, { color: C.orange }]}>-{formatAmount(monthExpense)}</Text>
            <Text style={s.miniSub}>Net: {formatAmount(netProfit)}</Text>
          </View>
        </View>

        {/* ── DAILY REVENUE CHART ── */}
        <View style={s.card}>
          {/* Chart Header + Week Navigator */}
          <View style={s.chartHeader}>
            <Text style={s.secTitle}>Daily Revenue</Text>
            {weekRevenue.some(d => d.amount > 0) && (
              <Text style={s.peakLabel}>
                Peak: {weekRevenue.reduce((pk, d) => d.amount > pk.amount ? d : pk, weekRevenue[0])
                  ?.date ? new Date(weekRevenue.reduce((pk, d) => d.amount > pk.amount ? d : pk, weekRevenue[0]).date)
                    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
              </Text>
            )}
          </View>

          {/* Week navigator */}
          <View style={s.weekNav}>
            <TouchableOpacity onPress={goPrevWeek} style={s.weekArrow} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={16} color={C.primary} />
            </TouchableOpacity>
            <Text style={s.weekLabel}>{weekLabel}</Text>
            <TouchableOpacity onPress={goNextWeek} style={s.weekArrow} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={16} color={C.primary} />
            </TouchableOpacity>
          </View>

          {/* Bar chart */}
          <View style={s.barsContainer}>
            {weekRevenue.map((d, i) => {
              const isSelected = d.date === selectedDay;
              const barH = d.amount > 0 ? Math.max(Math.round((d.amount / maxWeekVal) * 110), 8) : 4;
              const dateNum = new Date(d.date).getDate();
              return (
                <TouchableOpacity
                  key={d.date}
                  style={s.barCol}
                  onPress={() => {
                    setSelectedDay(d.date);
                    if (d.transactions.length > 0) setDayModal(true);
                  }}
                  activeOpacity={0.75}
                >
                  {/* Amount label above bar */}
                  <Text style={[s.barAmtTxt, isSelected && { color: C.primary, fontWeight: '700' }]}>
                    {d.amount > 0 ? `₹${d.amount >= 1000 ? (d.amount / 1000).toFixed(1) + 'k' : d.amount}` : ''}
                  </Text>
                  {/* Bar */}
                  <View style={s.barSpace}>
                    <View style={[
                      s.bar,
                      { height: barH },
                      isSelected
                        ? { backgroundColor: C.primary, width: 28, borderRadius: 10 }
                        : { backgroundColor: C.primary + '30', borderRadius: 8 }
                    ]} />
                  </View>
                  {/* Day label */}
                  <Text style={[s.barDayTxt, isSelected && { color: C.primary, fontWeight: '700' }]}>
                    {DAY_LABELS[i]}
                  </Text>
                  <Text style={[s.barDateTxt, isSelected && { color: C.primary }]}>
                    {dateNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected day summary */}
          {selectedDayData.amount > 0 ? (
            <TouchableOpacity
              style={s.dayDetailRow}
              onPress={() => setDayModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={14} color={C.primary} />
              <Text style={s.dayDetailTxt}>
                {new Date(selectedDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                {' · '}
                <Text style={{ color: C.green, fontWeight: '700' }}>{formatAmount(selectedDayData.amount)}</Text>
                {' · '}{selectedDayData.transactions.length} payment(s)
              </Text>
              <Ionicons name="chevron-forward" size={14} color={C.primary} />
            </TouchableOpacity>
          ) : (
            <View style={s.dayDetailRow}>
              <Ionicons name="calendar-outline" size={14} color={C.textGray} />
              <Text style={[s.dayDetailTxt, { color: C.textGray }]}>
                {new Date(selectedDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                {' · No revenue recorded'}
              </Text>
            </View>
          )}
        </View>

        {/* ── SHIFT-WISE BREAKDOWN ── */}
        <View style={s.card}>
          <Text style={s.secTitle}>Shift-wise Breakdown</Text>
          {shiftBreakdown.map(({ shift, amount, pct }) => (
            <View key={shift} style={s.shiftRow}>
              <Text style={s.shiftLabel}>{shift}</Text>
              <View style={s.progressTrack}>
                <View style={[
                  s.progressFill,
                  {
                    width: `${Math.round(pct * 100)}%`,
                    backgroundColor: shiftColors[shift] || C.primary,
                  }
                ]} />
              </View>
              <Text style={s.shiftAmt}>{formatAmount(amount)}</Text>
            </View>
          ))}
          {shiftBreakdown.every(s => s.amount === 0) && (
            <Text style={s.emptyTxt}>No shift data yet for {MONTH_NAMES[viewingMonth]}</Text>
          )}
        </View>

        {/* ── DUE COLLECTIONS ── */}
        <View style={s.card}>
          <View style={s.secRow}>
            <Text style={s.secTitle}>Due Collections</Text>
            {overdueStudents.length > 0 && (
              <View style={s.pendingBadge}>
                <Text style={s.pendingTxt}>{overdueStudents.length} pending</Text>
              </View>
            )}
          </View>

          {overdueStudents.length === 0 ? (
            <View style={s.emptyDue}>
              <Ionicons name="checkmark-circle-outline" size={36} color={C.green} />
              <Text style={s.emptyDueTxt}>All students are up to date! 🎉</Text>
            </View>
          ) : (
            <>
              {totalDues > 0 && (
                <View style={s.duesBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={C.orange} />
                  <Text style={s.duesBannerTxt}>
                    Total outstanding: <Text style={{ fontWeight: '800' }}>{formatAmount(totalDues)}</Text>
                  </Text>
                </View>
              )}
              {overdueStudents.map((b) => (
                <View key={b._id} style={s.dueCard}>
                  {/* Left accent border */}
                  <View style={[s.dueAccent, {
                    backgroundColor: b.daysOverdue > 10 ? C.red : C.orange
                  }]} />
                  <View style={[s.dueAva, {
                    backgroundColor: b.daysOverdue > 10 ? C.redLight : C.orangeLight
                  }]}>
                    <Text style={[s.dueAvaInit, {
                      color: b.daysOverdue > 10 ? C.red : C.orange
                    }]}>
                      {(b.student?.name || 'S').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.dueName}>{b.student?.name || 'Student'}</Text>
                    <Text style={s.dueSub}>Seat {b.seat} · {b.shift}</Text>
                    <Text style={[s.dueOverdue, { color: b.daysOverdue > 10 ? C.red : C.orange }]}>
                      ⏰ {b.daysOverdue} day{b.daysOverdue !== 1 ? 's' : ''} overdue · {formatAmount(b.fee)} due
                    </Text>
                    <View style={s.dueActions}>
                      <TouchableOpacity style={s.collectBtn} onPress={() => openCollect(b)} activeOpacity={0.85}>
                        <Ionicons name="checkmark" size={13} color="#FFF" />
                        <Text style={s.collectBtnTxt}>Collect</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.waBtn} onPress={() => sendWhatsApp(b)} activeOpacity={0.85}>
                        <Ionicons name="logo-whatsapp" size={13} color="#16A34A" />
                        <Text style={s.waBtnTxt}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* ── ADD EXPENSE BTN ── */}
        <TouchableOpacity style={s.addExpenseBtn} onPress={() => setExpModal(true)} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={s.addExpenseTxt}>Add Expense</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════════ */}
      {/* ── DAY DETAIL MODAL ── */}
      {/* ═══════════════════════════════════════════ */}
      <Modal visible={dayModal} animationType="slide" transparent onRequestClose={() => setDayModal(false)}>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <View>
                <Text style={s.modalTitle}>
                  {new Date(selectedDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <Text style={s.modalSub}>{formatAmount(selectedDayData.amount)} total · {selectedDayData.transactions.length} payment(s)</Text>
              </View>
              <TouchableOpacity onPress={() => setDayModal(false)}>
                <Ionicons name="close" size={22} color={C.textGray} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {selectedDayData.transactions.length === 0 ? (
                <Text style={[s.emptyTxt, { paddingVertical: 20 }]}>No payments on this day.</Text>
              ) : selectedDayData.transactions.map((t, i) => (
                <View key={t.id} style={[s.txnRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: C.border }]}>
                  <View style={s.txnAva}>
                    <Text style={s.txnAvaInit}>
                      {t.studentName ? t.studentName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '₹'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txnName}>{t.studentName || t.note || 'Payment'}</Text>
                    <Text style={s.txnMeta}>{t.shift || t.category} · {t.method}</Text>
                  </View>
                  <Text style={s.txnAmt}>+{formatAmount(t.amount)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════ */}
      {/* ── COLLECT MODAL (from dues section) ── */}
      {/* ═══════════════════════════════════════════ */}
      <Modal visible={collectModal} animationType="slide" transparent onRequestClose={() => setCollectModal(false)}>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Collect Payment</Text>
              <TouchableOpacity onPress={() => setCollectModal(false)}>
                <Ionicons name="close" size={22} color={C.textGray} />
              </TouchableOpacity>
            </View>
            {collectStudent && (
              <View style={s.collectStudentInfo}>
                <Text style={s.collectStudentName}>{collectStudent.student?.name}</Text>
                <Text style={s.collectStudentMeta}>Seat {collectStudent.seat} · {collectStudent.shift} · {collectStudent.daysOverdue} days overdue</Text>
              </View>
            )}
            <Text style={s.lbl}>Amount (₹)</Text>
            <TextInput
              style={s.inp}
              keyboardType="numeric"
              value={collectForm.amount}
              onChangeText={v => setCollectForm(p => ({ ...p, amount: v }))}
              placeholder="Enter amount"
              placeholderTextColor={C.textGray}
            />
            <Text style={s.lbl}>Payment Method</Text>
            <View style={s.methodRow}>
              {['UPI', 'Cash', 'Online'].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.methodChip, collectForm.method === m && s.methodChipAct]}
                  onPress={() => setCollectForm(p => ({ ...p, method: m }))}
                >
                  <Text style={[s.methodChipTxt, collectForm.method === m && { color: '#FFF' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={handleCollect} activeOpacity={0.85} disabled={collectSaving}>
              <Text style={s.saveTxt}>{collectSaving ? 'Saving…' : '✅ Record & Save to Revenue'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════ */}
      {/* ── ADD EXPENSE MODAL ── */}
      {/* ═══════════════════════════════════════════ */}
      <Modal visible={expModal} animationType="slide" transparent onRequestClose={() => setExpModal(false)}>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setExpModal(false)}>
                <Ionicons name="close" size={22} color={C.textGray} />
              </TouchableOpacity>
            </View>
            <Text style={s.lbl}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
              {EXPENSE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[s.catChip, expForm.category === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setExpForm(p => ({ ...p, category: cat.key }))}
                  activeOpacity={0.8}
                >
                  <Ionicons name={cat.icon} size={14} color={expForm.category === cat.key ? '#FFF' : C.textGray} />
                  <Text style={[s.catChipTxt, expForm.category === cat.key && { color: '#FFF' }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.lbl}>Amount (₹)</Text>
            <TextInput
              style={s.inp}
              keyboardType="numeric"
              value={expForm.amount}
              onChangeText={v => setExpForm(p => ({ ...p, amount: v }))}
              placeholder="e.g. 1200"
              placeholderTextColor={C.textGray}
            />
            <Text style={s.lbl}>Note (optional)</Text>
            <TextInput
              style={s.inp}
              value={expForm.note}
              onChangeText={v => setExpForm(p => ({ ...p, note: v }))}
              placeholder="e.g. June electricity bill"
              placeholderTextColor={C.textGray}
            />
            <Text style={s.lbl}>Paid via</Text>
            <View style={s.methodRow}>
              {['Cash', 'UPI', 'Online'].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.methodChip, expForm.method === m && s.methodChipAct]}
                  onPress={() => setExpForm(p => ({ ...p, method: m }))}
                >
                  <Text style={[s.methodChipTxt, expForm.method === m && { color: '#FFF' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.orange }]} onPress={handleAddExpense} activeOpacity={0.85} disabled={expSaving}>
              <Text style={s.saveTxt}>{expSaving ? 'Saving…' : '➕ Add Expense'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ──
const BAR_W = Math.floor((width - 64) / 7);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 16, paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.bg,
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.textDark },

  // Month navigator
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, marginBottom: 16,
  },
  navArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, borderWidth: 0.5, borderColor: C.primaryBorder, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '700', color: C.textDark, minWidth: 160, textAlign: 'center' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, borderWidth: 0.5, borderColor: C.border, padding: 16 },
  statCardTeal: { backgroundColor: C.primaryLight, borderColor: C.primaryBorder },
  statLabel: { color: C.textGray, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  statLabelTeal: { color: C.primaryDark, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  statVal: { color: C.textDark, fontSize: 22, fontWeight: '800' },
  statValTeal: { color: C.primary, fontSize: 22, fontWeight: '800' },
  statSub: { color: C.textGray, fontSize: 11, marginTop: 4 },
  statSubTeal: { color: C.primary, fontSize: 11, marginTop: 4 },

  // Mini income/expense cards
  miniCard: { flex: 1, borderRadius: 16, borderWidth: 0.5, padding: 14 },
  miniLabel: { color: C.textGray, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  miniVal: { fontSize: 18, fontWeight: '800' },
  miniSub: { color: C.textGray, fontSize: 11, marginTop: 3 },

  // Card container
  card: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 0.5, borderColor: C.border, padding: 16, marginBottom: 12 },

  // Chart
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  peakLabel: { fontSize: 12, fontWeight: '600', color: C.primary },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  weekArrow: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.primaryLight, borderWidth: 0.5, borderColor: C.primaryBorder, justifyContent: 'center', alignItems: 'center' },
  weekLabel: { fontSize: 13, fontWeight: '600', color: C.textDark, flex: 1, textAlign: 'center' },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, marginBottom: 12 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barAmtTxt: { fontSize: 9, color: C.textGray, marginBottom: 4, textAlign: 'center' },
  barSpace: { width: '100%', flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 22, minHeight: 4 },
  barDayTxt: { fontSize: 11, color: C.textGray, fontWeight: '600', marginTop: 6 },
  barDateTxt: { fontSize: 10, color: C.textGray, marginTop: 1 },
  dayDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, borderRadius: 12, padding: 10, marginTop: 4 },
  dayDetailTxt: { flex: 1, fontSize: 13, color: C.textDark, fontWeight: '500' },

  // Shift breakdown
  secTitle: { fontSize: 16, fontWeight: '700', color: C.textDark, marginBottom: 14 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  shiftLabel: { width: 72, fontSize: 13, fontWeight: '600', color: C.textGray },
  progressTrack: { flex: 1, height: 10, backgroundColor: '#EEE', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 5, minWidth: 4 },
  shiftAmt: { width: 70, fontSize: 13, fontWeight: '700', color: C.textDark, textAlign: 'right' },
  emptyTxt: { color: C.textGray, fontSize: 13, textAlign: 'center' },

  // Due collections
  pendingBadge: { backgroundColor: C.orangeLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 0.5, borderColor: C.orangeBorder },
  pendingTxt: { color: C.orange, fontSize: 12, fontWeight: '700' },
  duesBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.orangeLight, borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 0.5, borderColor: C.orangeBorder },
  duesBannerTxt: { color: C.orange, fontSize: 13 },
  dueCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.bg, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, padding: 14, marginBottom: 10, overflow: 'hidden' },
  dueAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 4 },
  dueAva: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  dueAvaInit: { fontSize: 15, fontWeight: '700' },
  dueName: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  dueSub: { fontSize: 12, color: C.textGray, fontWeight: '500', marginBottom: 4 },
  dueOverdue: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  dueActions: { flexDirection: 'row', gap: 8 },
  collectBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  collectBtnTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.greenLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 0.5, borderColor: C.greenBorder },
  waBtnTxt: { color: C.green, fontSize: 13, fontWeight: '700' },
  emptyDue: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyDueTxt: { color: C.textGray, fontSize: 14, fontWeight: '500' },

  // Add expense button
  addExpenseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, marginTop: 4 },
  addExpenseTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.textDark },
  modalSub: { color: C.textGray, fontSize: 13, marginTop: 3 },

  // Day detail transactions
  txnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  txnAva: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  txnAvaInit: { fontSize: 13, fontWeight: '700', color: C.primary },
  txnName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  txnMeta: { fontSize: 12, color: C.textGray },
  txnAmt: { fontSize: 15, fontWeight: '800', color: C.green },

  // Collect modal
  collectStudentInfo: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 0.5, borderColor: C.primaryBorder },
  collectStudentName: { fontSize: 16, fontWeight: '700', color: C.textDark, marginBottom: 4 },
  collectStudentMeta: { fontSize: 13, color: C.textGray },

  // Inputs
  lbl: { color: C.textGray, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  inp: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.textDark, marginBottom: 10 },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  methodChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg },
  methodChipAct: { backgroundColor: C.primary, borderColor: C.primary },
  methodChipTxt: { fontSize: 13, fontWeight: '600', color: C.textGray },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg },
  catChipTxt: { fontSize: 13, fontWeight: '600', color: C.textGray },
  saveBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  saveTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
