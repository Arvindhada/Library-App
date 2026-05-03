import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';

export default function OwnerReports() {
  const router = useRouter();
  const { currentBookings, currentLibrary, fetchDashboardData, loading } = useApp();
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(5);

  // Calculate revenue from real bookings
  const activeBookings = currentBookings.filter(b => b.status === 'Active');
  const totalRevenue = useMemo(() => {
    return activeBookings.reduce((acc, b) => {
      const fee = b.shift === 'Half Time' ? (currentLibrary?.halfTime?.fee || 0) : (currentLibrary?.fullTime?.fee || 0);
      return acc + fee;
    }, 0);
  }, [activeBookings, currentLibrary]);

  const fullTimeCount = activeBookings.filter(b => b.shift === 'Full Time').length;
  const halfTimeCount = activeBookings.filter(b => b.shift === 'Half Time').length;
  const fullTimeRevenue = fullTimeCount * (currentLibrary?.fullTime?.fee || 0);
  const halfTimeRevenue = halfTimeCount * (currentLibrary?.halfTime?.fee || 0);

  // Monthly chart — show active bookings count per month as revenue estimate
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      // Filter bookings created in this month
      const monthBookings = currentBookings.filter(b => {
        const created = new Date(b.createdAt || b.startDate);
        return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
      });
      const value = monthBookings.reduce((sum, b) => {
        const fee = b.shift === 'Half Time' ? (currentLibrary?.halfTime?.fee || 0) : (currentLibrary?.fullTime?.fee || 0);
        return sum + fee;
      }, 0);
      months.push({ label, value, bookings: monthBookings });
    }
    return months;
  }, [currentBookings, currentLibrary]);

  const maxChartVal = Math.max(...chartData.map(d => d.value), 1000);
  const selectedMonthData = chartData[selectedMonthIdx];


  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.heading}>Reports & Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} colors={[colors.primary]} />}
      >
        {/* Total Revenue Overview */}
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Monthly Revenue (Active Students)</Text>
          <Text style={s.summaryValue}>₹{totalRevenue.toLocaleString()}</Text>
          <View style={s.summaryRow}>
            <View style={s.summaryBadge}>
              <Text style={s.summaryBadgeText}>Full Time: ₹{fullTimeRevenue.toLocaleString()}</Text>
            </View>
            <View style={[s.summaryBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={s.summaryBadgeText}>Half Time: ₹{halfTimeRevenue.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Student Breakdown */}
        <View style={s.section}>
          <Text style={s.secTitle}>Student Breakdown</Text>
          <View style={s.breakdownCard}>
            <View style={s.breakdownRow}>
              <Ionicons name="sunny-outline" size={20} color={colors.warning} />
              <Text style={s.breakdownLabel}>Half Time Students</Text>
              <Text style={s.breakdownVal}>{halfTimeCount}</Text>
            </View>
            <View style={[s.breakdownRow, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
              <Ionicons name="moon-outline" size={20} color={colors.info} />
              <Text style={s.breakdownLabel}>Full Time Students</Text>
              <Text style={s.breakdownVal}>{fullTimeCount}</Text>
            </View>
            <View style={[s.breakdownRow, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={s.breakdownLabel}>Total Active</Text>
              <Text style={[s.breakdownVal, { color: colors.primary }]}>{activeBookings.length}</Text>
            </View>
          </View>
        </View>

        {/* Revenue Trends Chart */}
        <View style={s.section}>
          <Text style={s.secTitle}>Monthly Trend (Last 6 Months)</Text>
          <View style={s.chartCard}>
            <View style={s.chartContainer}>
              {chartData.map((d, i) => {
                const heightPercentage = Math.round((d.value / maxChartVal) * 100) + '%';
                const isSelected = selectedMonthIdx === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={s.chartCol}
                    onPress={() => setSelectedMonthIdx(i)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chartValText, isSelected && { color: colors.primary, fontWeight: 'bold' }]}>
                      {d.value > 0 ? `₹${(d.value / 1000).toFixed(1)}k` : '-'}
                    </Text>
                    <View style={s.chartBarSpace}>
                      <View style={[
                        s.chartBar,
                        { height: d.value > 0 ? heightPercentage : 4 },
                        isSelected && { backgroundColor: colors.primary, width: 28 }
                      ]} />
                    </View>
                    <Text style={[s.chartLabel, isSelected && { color: colors.primary, fontWeight: 'bold' }]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Bookings for selected month */}
        <View style={s.section}>
          <View style={s.secHeader}>
            <Text style={s.secTitle}>Bookings — {selectedMonthData?.label}</Text>
            <Text style={s.monthTotal}>₹{(selectedMonthData?.value || 0).toLocaleString()}</Text>
          </View>
          <View style={s.listCard}>
            {(selectedMonthData?.bookings?.length || 0) === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
                <Text style={s.emptyText}>No bookings recorded for {selectedMonthData?.label}.</Text>
              </View>
            ) : (
              selectedMonthData.bookings.map((b, i) => (
                <View key={b._id} style={[s.payRow, i !== selectedMonthData.bookings.length - 1 && s.payBorder]}>
                  <View style={s.payIcon}>
                    <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={s.payDetails}>
                    <Text style={s.payName}>{b.student?.name || 'Student'}</Text>
                    <Text style={s.payDate}>Seat {b.seat} • {b.shift}</Text>
                  </View>
                  <Text style={s.payAmount}>
                    +₹{(b.shift === 'Half Time' ? currentLibrary?.halfTime?.fee : currentLibrary?.fullTime?.fee) || 0}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: colors.white },
  backBtn: { padding: 4 },
  heading: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  summaryCard: { backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 20, padding: 24, borderRadius: 20, elevation: 6, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { color: colors.white, fontSize: 38, fontWeight: 'bold', marginVertical: 8 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  summaryBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  summaryBadgeText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  section: { marginTop: 28, paddingHorizontal: 16 },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  secTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
  monthTotal: { fontSize: 16, fontWeight: 'bold', color: colors.success },
  breakdownCard: { backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  breakdownLabel: { flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  breakdownVal: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  chartCard: { backgroundColor: colors.white, padding: 20, borderRadius: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180 },
  chartCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartValText: { fontSize: 10, color: colors.textLight, marginBottom: 8 },
  chartBarSpace: { width: '100%', flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: 22, backgroundColor: colors.primary + '30', borderRadius: 11 },
  chartLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 10, fontWeight: '600' },
  listCard: { backgroundColor: colors.white, borderRadius: 24, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textLight, textAlign: 'center', marginTop: 12, fontSize: 14, lineHeight: 20 },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  payBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  payIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  payDetails: { flex: 1 },
  payName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  payDate: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  payAmount: { fontSize: 17, fontWeight: '800', color: colors.success },
});
