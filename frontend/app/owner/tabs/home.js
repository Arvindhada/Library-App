import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import { dummyStudents, weeklyRevenue } from '../../../src/constants/dummyData';
import LibraryCard from '../../../src/components/LibraryCard';

export default function OwnerHome() {
  const router = useRouter();
  const { ownerData, getOwnerLibrary, libraries } = useApp();
  const lib = getOwnerLibrary();
  const occupancy = lib ? Math.round(((lib.totalSeats - lib.vacantSeats) / lib.totalSeats) * 100) : 0;
  const totalRevenue = weeklyRevenue.reduce((a, b) => a + b.amount, 0);
  const maxRev = Math.max(...weeklyRevenue.map((w) => w.amount));

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.hello}>Hello,</Text>
          <Text style={s.name}>{ownerData.name}!</Text>
        </View>
        <TouchableOpacity style={s.bell}><Ionicons name="notifications-outline" size={24} color={colors.textPrimary} /></TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { borderLeftColor: colors.info }]}><Text style={s.statVal}>{lib?.totalSeats || 0}</Text><Text style={s.statLbl}>Total</Text></View>
        <View style={[s.statCard, { borderLeftColor: colors.success }]}><Text style={[s.statVal, { color: colors.success }]}>{lib?.vacantSeats || 0}</Text><Text style={s.statLbl}>Vacant</Text></View>
        <View style={[s.statCard, { borderLeftColor: colors.danger }]}><Text style={[s.statVal, { color: colors.danger }]}>{lib?.bookedSeats || 0}</Text><Text style={s.statLbl}>Occupied</Text></View>
      </View>

      {/* Occupancy */}
      <View style={s.occCard}>
        <Text style={s.occText}>Your library is <Text style={{ color: colors.primary, fontWeight: '700' }}>{occupancy}% occupied</Text></Text>
        <View style={s.barBg}><View style={[s.barFill, { width: `${occupancy}%` }]} /></View>
      </View>

      {/* Revenue */}
      <View style={s.revCard}>
        <Text style={s.secTitle}>This Month's Revenue</Text>
        <Text style={s.revAmount}>₹{totalRevenue.toLocaleString()}</Text>
        <View style={s.chartRow}>
          {weeklyRevenue.map((w) => (
            <View key={w.day} style={s.chartCol}>
              <View style={[s.chartBar, { height: (w.amount / maxRev) * 60 }]} />
              <Text style={s.chartLbl}>{w.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Currently in Library */}
      <View style={s.section}>
        <Text style={s.secTitle}>Currently in Library</Text>
        {dummyStudents.map((st) => (
          <View key={st.id} style={s.studentRow}>
            <View style={s.avatar}><Ionicons name="person" size={18} color={colors.white} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.stName}>{st.name}</Text>
              <Text style={s.stGoal}>{st.goal}</Text>
            </View>
            <View style={s.seatBadge}><Text style={s.seatText}>Seat {st.seat}</Text></View>
            <Text style={s.since}>{st.since}</Text>
          </View>
        ))}
      </View>

      {/* Discover Libraries */}
      <View style={s.section}>
        <Text style={s.secTitle}>Discover Libraries</Text>
        {libraries.filter((l) => l.id !== ownerData.libraryId).slice(0, 3).map((lib) => (
          <LibraryCard key={lib.id} library={lib} onPress={() => router.push({ pathname: '/student/library-detail', params: { id: lib.id } })} />
        ))}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: colors.white },
  hello: { fontSize: 15, color: colors.textSecondary },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  bell: { padding: 6 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 10, padding: 14, borderLeftWidth: 4, alignItems: 'center' },
  statVal: { fontSize: 26, fontWeight: 'bold', color: colors.textPrimary },
  statLbl: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  occCard: { backgroundColor: colors.white, borderRadius: 10, padding: 16, marginHorizontal: 16, marginTop: 14 },
  occText: { fontSize: 14, color: colors.textPrimary, marginBottom: 10 },
  barBg: { height: 10, backgroundColor: colors.cardBorder, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: colors.primary, borderRadius: 5 },
  revCard: { backgroundColor: colors.white, borderRadius: 10, padding: 16, marginHorizontal: 16, marginTop: 14 },
  revAmount: { fontSize: 28, fontWeight: 'bold', color: colors.success, marginVertical: 8 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, height: 80 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBar: { width: 18, backgroundColor: colors.primary, borderRadius: 4, minHeight: 6 },
  chartLbl: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  secTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 12, borderRadius: 10, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  stName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  stGoal: { fontSize: 12, color: colors.textSecondary },
  seatBadge: { backgroundColor: colors.lightOrangeBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 6 },
  seatText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  since: { fontSize: 11, color: colors.textLight },
});
