// Owner Dashboard — Stats, Revenue, Students + Seat Manager button
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import { sendFeeReminder } from '../../../src/services/whatsapp';

export default function OwnerDashboard() {
  const router = useRouter();
  const { ownerData, getOwnerLibrary, students, payments, activities } = useApp();
  const lib = getOwnerLibrary();
  
  const occupiedCount = students.length; 
  const totalSeats = lib?.totalSeats || 0;
  const vacantCount = Math.max(0, totalSeats - occupiedCount);
  const occupancy = totalSeats > 0 ? Math.round((occupiedCount / totalSeats) * 100) : 0;
  
  const totalRevenue = payments.reduce((a, b) => a + b.amount, 0);

  // Date-based expiry calculation (same logic as Manage Students)
  const todayStr = new Date().toISOString().split('T')[0];
  const twoDaysLater = new Date();
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);
  const twoDaysLaterStr = twoDaysLater.toISOString().split('T')[0];
  
  const expiringSoon = students.filter(s => {
    const isDue = s.expiry < todayStr;
    const isSoon = !isDue && s.expiry <= twoDaysLaterStr;
    return isDue || isSoon;
  });

  const quickActions = [
    { id: '1', title: 'Add Student', icon: 'person-add', color: colors.primary, onPress: () => router.push('/owner/manage-students') },
    { id: '2', title: 'Seat Manager', icon: 'grid', color: colors.info, onPress: () => router.push('/owner/seat-manager') },
    { id: '3', title: 'Edit Library', icon: 'business', color: '#8E44AD', onPress: () => router.push('/owner/tabs/library') },
    { id: '4', title: 'View Reports', icon: 'bar-chart', color: colors.success, onPress: () => Alert.alert('Coming Soon', 'Detailed reports are being developed.') },
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View>
          <Text style={s.hello}>Welcome, {ownerData.name.split(' ')[0]}</Text>
          <Text style={s.subHello}>{lib?.name || 'Your Library'}</Text>
        </View>
        <TouchableOpacity style={s.notifBtn}><Ionicons name="notifications-outline" size={24} color={colors.textPrimary} /></TouchableOpacity>
      </View>

      {/* New Main Stats */}
      <View style={s.newStatsContainer}>
        <View style={s.statCardsRow}>
          <View style={[s.statCard, { borderLeftColor: colors.primary }]}>
            <Text style={s.statCardVal}>{totalSeats}</Text>
            <Text style={s.statCardLbl}>Total</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: colors.success }]}>
            <Text style={[s.statCardVal, { color: colors.success }]}>{vacantCount}</Text>
            <Text style={s.statCardLbl}>Vacant</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: colors.danger }]}>
            <Text style={[s.statCardVal, { color: colors.danger }]}>{occupiedCount}</Text>
            <Text style={s.statCardLbl}>Occupied</Text>
          </View>
        </View>
        <Text style={s.progressText}>
          Your library is <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{occupancy}% occupied</Text>
        </Text>
        <View style={s.progressBarBg}>
          <View style={[s.progressBarFill, { width: `${occupancy}%` }]} />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.secTitle}>Quick Actions</Text>
        <View style={s.actionGrid}>
          {quickActions.map(action => (
            <TouchableOpacity key={action.id} style={s.actionCard} onPress={action.onPress}>
              <View style={[s.actionIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={s.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Revenue Card (New Design) */}
      <View style={s.newRevCard}>
        <Text style={s.newRevTitle}>This Month's Revenue</Text>
        <Text style={s.newRevVal}>₹{totalRevenue.toLocaleString()}</Text>
        
        {/* Simple mock bar chart */}
        <View style={s.chartContainer}>
          {[
            { day: 'Mon', val: 40 },
            { day: 'Tue', val: 65 },
            { day: 'Wed', val: 50 },
            { day: 'Thu', val: 80 },
            { day: 'Fri', val: 55 },
            { day: 'Sat', val: 45 },
            { day: 'Sun', val: 30 },
          ].map((item, idx) => (
            <View key={idx} style={s.chartCol}>
              <View style={[s.chartBar, { height: item.val }]} />
              <Text style={s.chartDay}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Alerts / Expiry */}
      {expiringSoon.length > 0 && (
        <View style={s.section}>
          <Text style={[s.secTitle, { color: colors.danger }]}>⚠️ Fee Due / Expiring ({expiringSoon.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.expiryScroll}>
            {expiringSoon.map(st => {
              const fee = st.plan === 'Half Time' ? lib?.halfTime?.fee : lib?.fullTime?.fee;
              return (
                <View key={st.id} style={s.expiryCard}>
                  <Text style={s.expName}>{st.name}</Text>
                  <Text style={s.expSeat}>Seat {st.seat} • {st.plan}</Text>
                  <Text style={[s.expDate, { color: st.expiry < todayStr ? colors.danger : colors.warning }]}>
                    Exp: {st.expiry}
                  </Text>
                  <TouchableOpacity
                    style={s.remindBtn}
                    onPress={() => sendFeeReminder(st.phone, st.name, fee, lib?.name)}
                  >
                    <Text style={s.remindText}>📲 Remind</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Recent Activity */}
      <View style={s.section}>
        <Text style={s.secTitle}>Recent Activity</Text>
        <View style={s.activityList}>
          {activities.map(act => (
            <View key={act.id} style={s.actRow}>
              <View style={[s.actDot, { backgroundColor: act.type === 'payment' ? colors.success : colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.actText}>{act.text}</Text>
                <Text style={s.actTime}>{act.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, backgroundColor: colors.white },
  hello: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  subHello: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgLight, justifyContent: 'center', alignItems: 'center' },
  newStatsContainer: { marginHorizontal: 16, marginTop: 10 },
  statCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statCardVal: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  statCardLbl: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  progressText: { fontSize: 14, color: colors.textPrimary, marginBottom: 8 },
  progressBarBg: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  secTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '48%', backgroundColor: colors.white, padding: 16, borderRadius: 16, alignItems: 'center' },
  actionIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  newRevCard: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 20, padding: 20, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  newRevTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  newRevVal: { fontSize: 32, fontWeight: 'bold', color: colors.success, marginTop: 8 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, height: 90 },
  chartCol: { alignItems: 'center', width: 30 },
  chartBar: { width: 16, backgroundColor: colors.primary, borderRadius: 4 },
  chartDay: { fontSize: 11, color: colors.textLight, marginTop: 8 },
  expiryScroll: { marginTop: 4 },
  expiryCard: { backgroundColor: colors.white, padding: 16, borderRadius: 16, marginRight: 12, width: 155, borderWidth: 1, borderColor: colors.danger + '30' },
  expName: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary },
  expSeat: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  expDate: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  remindBtn: { backgroundColor: colors.danger + '10', marginTop: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  remindText: { color: colors.danger, fontSize: 12, fontWeight: 'bold' },
  activityList: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  actRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  actDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 12 },
  actText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  actTime: { fontSize: 11, color: colors.textLight, marginTop: 2 },
});
