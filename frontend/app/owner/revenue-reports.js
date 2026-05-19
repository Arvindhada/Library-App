// Revenue Reports Screen — Monthly breakdown, shift-wise, pending vs collected
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';
import { API_ENDPOINTS } from '../../src/services/apiConfig';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 100;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function RevenueReports() {
  const router = useRouter();
  const { revenue, dashboardStats, currentBookings: students, currentLibrary } = useApp();

  const monthReport = useMemo(() => {
    const morning   = (students || []).filter(s => s.shift === 'Morning' && s.status === 'Active');
    const fullDay   = (students || []).filter(s => s.shift === 'Full Day' && s.status === 'Active');
    const due       = (students || []).filter(s => s.status === 'Active' && s.paymentStatus !== 'Paid');
    const halfFee   = currentLibrary?.half_time_fee || 0;
    const fullFee   = currentLibrary?.full_time_fee || 0;

    return {
      totalCollected: revenue?.thisMonth || 0,
      totalPending: (dashboardStats?.duePayments || 0) * (halfFee || 1000), 
      paidCount: (students || []).filter(s => s.status === 'Active' && s.paymentStatus === 'Paid').length,
      dueCount: dashboardStats?.duePayments || 0,
      morning,
      fullDay,
      due,
      halfFee,
      fullFee
    };
  }, [revenue, dashboardStats, students, currentLibrary]);

  const weekBars = useMemo(() => {
    if (!revenue?.breakdown) return [0,0,0,0,0,0];
    return revenue.breakdown.map(b => b.amount);
  }, [revenue]);

  const maxBar = Math.max(...weekBars, 1);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.heading}>Revenue Reports</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Main Cards */}
      <View style={s.cardRow}>
        <View style={[s.card, { borderLeftColor: colors.success }]}>
          <Text style={s.cardLbl}>This Month</Text>
          <Text style={[s.cardVal, { color: colors.success }]}>₹{monthReport.totalCollected.toLocaleString()}</Text>
          <Text style={s.cardSub}>{monthReport.paidCount} Fees Received</Text>
        </View>
        <View style={[s.card, { borderLeftColor: colors.danger }]}>
          <Text style={s.cardLbl}>Pending Dues</Text>
          <Text style={[s.cardVal, { color: colors.danger }]}>₹{monthReport.totalPending.toLocaleString()}</Text>
          <Text style={s.cardSub}>{monthReport.dueCount} students due</Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={s.chartCard}>
        <Text style={s.sectionTitle}>Monthly Revenue Breakdown</Text>
        <View style={s.chart}>
          {revenue?.breakdown?.map((b, i) => (
            <View key={i} style={s.barCol}>
              <Text style={s.barAmt}>₹{(b.amount/1000).toFixed(1)}k</Text>
              <View style={s.barBg}>
                <View style={[s.barFill, { height: maxBar > 0 ? (b.amount / maxBar) * BAR_MAX_HEIGHT : 0 }]} />
              </View>
              <Text style={s.barLabel}>{b.month}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Shift Breakdown */}
      <View style={s.shiftCard}>
        <Text style={s.sectionTitle}>Shift Breakdown</Text>
        <View style={s.shiftRow}>
          <View style={[s.shiftBox, { backgroundColor: '#FF6B3512' }]}>
            <Ionicons name="sunny-outline" size={24} color="#FF6B35" />
            <Text style={[s.shiftCount, { color: '#FF6B35' }]}>{monthReport.morning.length}</Text>
            <Text style={s.shiftLbl}>Half Time / Morning</Text>
            <Text style={[s.shiftAmt, { color: '#FF6B35' }]}>
              ₹{(monthReport.morning.length * monthReport.halfFee).toLocaleString()}
            </Text>
          </View>
          <View style={[s.shiftBox, { backgroundColor: '#7B61FF12' }]}>
            <Ionicons name="time-outline" size={24} color="#7B61FF" />
            <Text style={[s.shiftCount, { color: '#7B61FF' }]}>{monthReport.fullDay.length}</Text>
            <Text style={s.shiftLbl}>Full Day</Text>
            <Text style={[s.shiftAmt, { color: '#7B61FF' }]}>
              ₹{(monthReport.fullDay.length * monthReport.fullFee).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Student List — Due */}
      {monthReport.due.length > 0 && (
        <View style={s.dueSection}>
          <Text style={[s.sectionTitle, { color: colors.danger }]}>⚠️ Fee Due Students ({monthReport.due.length})</Text>
          {monthReport.due.map((st, idx) => (
            <View key={st._id || st.id || idx} style={s.dueRow}>
              <View style={s.dueAvatar}>
                <Ionicons name="person" size={16} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.dueName}>{st.student?.name || st.name}</Text>
                <Text style={s.duePhone}>{st.student?.phone || st.phone}</Text>
              </View>
              <Text style={[s.dueFee, { color: colors.danger }]}>₹{st.fee}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: colors.white },
  backBtn: { padding: 4 },
  heading: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },

  monthScroll: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.white, marginBottom: 4 },
  monthChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.bgLight, marginRight: 8, borderWidth: 1, borderColor: colors.cardBorder },
  monthActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  monthTextActive: { color: colors.white },

  cardRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  card: { flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 16, borderLeftWidth: 4, elevation: 2 },
  cardLbl: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  cardVal: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  cardSub: { fontSize: 12, color: colors.textLight },

  chartCard: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  chart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: BAR_MAX_HEIGHT + 60 },
  barCol: { alignItems: 'center', width: 60 },
  barAmt: { fontSize: 10, color: colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  barBg: { width: 28, height: BAR_MAX_HEIGHT, justifyContent: 'flex-end', backgroundColor: colors.bgLight, borderRadius: 6 },
  barFill: { width: '100%', backgroundColor: colors.primary, borderRadius: 6 },
  barLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },

  shiftCard: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, elevation: 2 },
  shiftRow: { flexDirection: 'row', gap: 12 },
  shiftBox: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  shiftCount: { fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  shiftLbl: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  shiftAmt: { fontSize: 14, fontWeight: '700', marginTop: 6 },

  dueSection: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, elevation: 2 },
  dueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.bgLight },
  dueAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dueName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  duePhone: { fontSize: 12, color: colors.textSecondary },
  dueFee: { fontSize: 14, fontWeight: 'bold' },
});
