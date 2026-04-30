// Owner Dashboard — Premium Redesign
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import { sendFeeReminder } from '../../../src/services/whatsapp';

const { width } = Dimensions.get('window');

export default function OwnerDashboard() {
  const router = useRouter();
  const { ownerData, getOwnerLibrary, students, payments, activities } = useApp();
  const lib = getOwnerLibrary();

  const occupiedCount = students.length;
  const totalSeats = lib?.totalSeats || 0;
  const vacantCount = Math.max(0, totalSeats - occupiedCount);
  const occupancy = totalSeats > 0 ? Math.round((occupiedCount / totalSeats) * 100) : 0;

  // This month's revenue (real data)
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const thisMonthRevenue = useMemo(() =>
    payments.filter(p => p.date.startsWith(currentMonthStr)).reduce((a, b) => a + b.amount, 0),
  [payments, currentMonthStr]);

  // Expiry calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const twoDaysLater = new Date();
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);
  const twoDaysLaterStr = twoDaysLater.toISOString().split('T')[0];

  const expiringSoon = students.filter(s => {
    const isDue = s.expiry < todayStr;
    const isSoon = !isDue && s.expiry <= twoDaysLaterStr;
    return isDue || isSoon;
  });

  const getInitials = (name) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* ── 1. HEADER ── */}
      <View style={s.header}>
        <View style={s.headerContent}>
          <View>
            <Text style={s.hello}>Hello, {ownerData.name.split(' ')[0]}! 👋</Text>
            <Text style={s.subHello}>{lib?.name || 'Your Library'}</Text>
          </View>
          <TouchableOpacity style={s.notifBtn}>
            <Ionicons name="notifications" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={s.headerCurve} />
      </View>

      <View style={s.body}>

        {/* ── 2. STATS PILLS ── */}
        <View style={s.pillRow}>
          <View style={s.pillCard}>
            <Text style={[s.pillVal, { color: colors.info }]}>{totalSeats}</Text>
            <Text style={s.pillLbl}>Total Seats</Text>
          </View>
          <View style={s.pillCard}>
            <Text style={[s.pillVal, { color: colors.success }]}>{vacantCount}</Text>
            <Text style={s.pillLbl}>Vacant</Text>
          </View>
          <View style={s.pillCard}>
            <Text style={[s.pillVal, { color: colors.danger }]}>{occupiedCount}</Text>
            <Text style={s.pillLbl}>Occupied</Text>
          </View>
        </View>

        {/* ── 3. OCCUPANCY BAR ── */}
        <View style={s.occupancyBox}>
          <View style={s.occupancyRow}>
            <Text style={s.occupancyText}>
              Your library is{' '}
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{occupancy}% occupied</Text>
            </Text>
            <Text style={s.occupancyPct}>{occupancy}%</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${occupancy}%` }]} />
          </View>
        </View>

        {/* ── 4. QUICK ACTIONS ── */}
        <Text style={s.secTitle}>Quick Actions</Text>
        <View style={s.actionGrid}>
          {[
            { title: 'Add Student',  icon: 'person-add', color: colors.success, bg: '#DCFCE7', route: '/owner/manage-students' },
            { title: 'Seat Manager', icon: 'grid',       color: colors.primary, bg: colors.lightOrangeBg, route: '/owner/seat-manager' },
            { title: 'Edit Library', icon: 'business',   color: colors.info, bg: '#DBEAFE', route: '/owner/tabs/library' },
            { title: 'View Reports', icon: 'bar-chart',  color: '#A855F7', bg: '#F3E8FF', route: '/owner/reports' },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={s.actionCard} onPress={() => router.push(a.route)}>
              <View style={[s.actionCircle, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={s.actionTitle}>{a.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 5. REVENUE CARD ── */}
        <View style={s.revCard}>
          <Text style={s.revLabel}>This Month's Revenue</Text>
          <Text style={s.revValue}>₹{thisMonthRevenue.toLocaleString()}</Text>
          <View style={s.revChart}>
            {[
              { day: 'Mon', val: 40 },
              { day: 'Tue', val: 65 },
              { day: 'Wed', val: 50 },
              { day: 'Thu', val: 80 },
              { day: 'Fri', val: 55 },
              { day: 'Sat', val: 45 },
              { day: 'Sun', val: 30 },
            ].map((item, idx) => (
              <View key={idx} style={s.revCol}>
                <View style={[s.revBar, { height: item.val }]} />
                <Text style={s.revDay}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 6. FEE DUE ── */}
        {expiringSoon.length > 0 && (
          <View style={s.section}>
            <View style={s.dueBadge}>
              <Ionicons name="warning" size={14} color={colors.primary} />
              <Text style={s.dueBadgeText}>Fee Due / Expiring ({expiringSoon.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {expiringSoon.map(st => {
                const fee = st.plan === 'Half Time' ? lib?.halfTime?.fee : lib?.fullTime?.fee;
                return (
                  <View key={st.id} style={s.dueCard}>
                    <Text style={s.dueName}>{st.name}</Text>
                    <Text style={s.dueMeta}>Seat {st.seat} • {st.plan}</Text>
                    <Text style={s.dueAmt}>₹{fee}</Text>
                    <TouchableOpacity
                      style={s.remindBtn}
                      onPress={() => sendFeeReminder(st.phone, st.name, fee, lib?.name)}
                    >
                      <Text style={s.remindText}>Remind</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── 7. CURRENTLY IN LIBRARY ── */}
        <View style={s.section}>
          <Text style={s.secTitle}>Currently in Library</Text>
          <View style={s.inLibCard}>
            {activities.length > 0 ? (
              activities.slice(0, 4).map((act, idx) => (
                <View
                  key={act.id}
                  style={[s.inLibRow, idx < Math.min(activities.length, 4) - 1 && s.inLibBorder]}
                >
                  <View style={s.inLibAvatar}>
                    <Text style={s.inLibInitials}>{getInitials(act.text.split(' ')[0])}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.inLibName}>{act.text.split(' ')[0]}</Text>
                    <Text style={s.inLibGoal}>Preparing for SSC</Text>
                  </View>
                  <View style={s.seatBadge}>
                    <Text style={s.seatBadgeText}>Seat 24</Text>
                  </View>
                  <Text style={s.inLibTime}>2h ago</Text>
                </View>
              ))
            ) : (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Ionicons name="people-outline" size={40} color={colors.textLight} />
                <Text style={{ color: colors.textLight, marginTop: 10 }}>No one checked in</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // 1. HEADER
  header: { backgroundColor: colors.primary, paddingTop: 58, paddingBottom: 0 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 24 },
  hello: { fontSize: 24, fontWeight: 'bold', color: colors.white },
  subHello: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCurve: { height: 30, backgroundColor: '#F9FAFB', borderTopLeftRadius: 30, borderTopRightRadius: 30 },

  body: { paddingHorizontal: 16, marginTop: -8 },

  // 2. PILLS
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  pillCard: { flex: 1, height: 78, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  pillVal: { fontSize: 24, fontWeight: 'bold' },
  pillLbl: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },

  // 3. OCCUPANCY
  occupancyBox: { marginBottom: 24 },
  occupancyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  occupancyText: { fontSize: 14, color: colors.textPrimary },
  occupancyPct: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  progressBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },

  // 4. ACTIONS
  secTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 14 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  actionCard: { width: (width - 44) / 2, backgroundColor: colors.white, padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  actionCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },

  // 5. REVENUE CARD
  revCard: { backgroundColor: colors.white, padding: 20, borderRadius: 20, borderLeftWidth: 5, borderLeftColor: colors.primary, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  revLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  revValue: { fontSize: 32, fontWeight: 'bold', color: colors.success, marginBottom: 16 },
  revChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
  revCol: { alignItems: 'center', width: 32 },
  revBar: { width: 14, backgroundColor: colors.primary, borderRadius: 7 },
  revDay: { fontSize: 10, color: colors.textLight, marginTop: 8 },

  // 6. FEE DUE
  section: { marginBottom: 24 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 14, borderWidth: 1, borderColor: '#FED7AA' },
  dueBadgeText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },
  dueCard: { backgroundColor: colors.white, padding: 16, borderRadius: 16, marginRight: 12, width: 162, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  dueName: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary },
  dueMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  dueAmt: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginTop: 8 },
  remindBtn: { borderWidth: 1.5, borderColor: colors.primary, marginTop: 10, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
  remindText: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },

  // 7. CURRENTLY IN LIBRARY
  inLibCard: { backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  inLibRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  inLibBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  inLibAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  inLibInitials: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  inLibName: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary },
  inLibGoal: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  seatBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  seatBadgeText: { color: colors.primary, fontWeight: 'bold', fontSize: 11 },
  inLibTime: { fontSize: 11, color: colors.textLight },
});
