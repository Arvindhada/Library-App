import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Switch, TextInput } from 'react-native';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import SeatBox from '../../../src/components/SeatBox';

export default function OwnerDashboard() {
  const { getOwnerLibrary, updateLibrarySeats } = useApp();
  const lib = getOwnerLibrary();
  const total = lib?.totalSeats || 80;

  // Seat grid state: true = booked, false = available
  const [seats, setSeats] = useState(() => {
    const arr = [];
    for (let i = 0; i < total; i++) arr.push(i < (lib?.bookedSeats || 0));
    return arr;
  });

  // Timing state
  const [halfEnabled, setHalfEnabled] = useState(true);
  const [fullEnabled, setFullEnabled] = useState(true);
  const [halfFee, setHalfFee] = useState(String(lib?.halfTime?.fee || 400));
  const [fullFee, setFullFee] = useState(String(lib?.fullTime?.fee || 800));

  const vacant = useMemo(() => seats.filter((s) => !s).length, [seats]);
  const booked = useMemo(() => seats.filter((s) => s).length, [seats]);

  const toggleSeat = (idx) => {
    setSeats((prev) => { const n = [...prev]; n[idx] = !n[idx]; return n; });
  };

  const saveChanges = () => {
    updateLibrarySeats(lib.id, vacant, booked);
    Alert.alert('Saved!', `Vacant: ${vacant}, Booked: ${booked}`);
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}><Text style={s.heading}>Seat Manager</Text></View>

      <View style={s.totalRow}>
        <Text style={s.totalText}>Total: {total} Seats</Text>
        <Text style={s.legend}><Text style={{ color: colors.success }}>■</Text> Available  <Text style={{ color: colors.danger }}>■</Text> Booked</Text>
      </View>

      {/* Seat Grid */}
      <View style={s.grid}>
        <FlatList
          data={seats}
          keyExtractor={(_, i) => String(i)}
          numColumns={8}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <SeatBox seatNumber={index + 1} isBooked={item} onPress={() => toggleSeat(index)} />
          )}
        />
      </View>

      <View style={s.summaryRow}>
        <View style={[s.sumCard, { backgroundColor: colors.success + '15' }]}><Text style={[s.sumVal, { color: colors.success }]}>{vacant}</Text><Text style={s.sumLbl}>Available</Text></View>
        <View style={[s.sumCard, { backgroundColor: colors.danger + '15' }]}><Text style={[s.sumVal, { color: colors.danger }]}>{booked}</Text><Text style={s.sumLbl}>Booked</Text></View>
      </View>

      <TouchableOpacity testID="save-seats-btn" style={s.saveBtn} onPress={saveChanges}>
        <Text style={s.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>

      {/* Timing & Fees */}
      <View style={s.timingSection}>
        <Text style={s.secTitle}>Timing & Fees</Text>

        <View style={s.timingCard}>
          <View style={s.timingHeader}>
            <Text style={s.timingTitle}>Half Time</Text>
            <Switch value={halfEnabled} onValueChange={setHalfEnabled} trackColor={{ true: colors.primary }} />
          </View>
          {halfEnabled && (
            <View>
              <Text style={s.timingDetail}>{lib?.halfTime?.from} - {lib?.halfTime?.to}</Text>
              <View style={s.feeRow}>
                <Text style={s.feeLabel}>₹</Text>
                <TextInput style={s.feeInput} value={halfFee} onChangeText={setHalfFee} keyboardType="number-pad" />
                <Text style={s.feeLabel}>/month</Text>
              </View>
            </View>
          )}
        </View>

        <View style={s.timingCard}>
          <View style={s.timingHeader}>
            <Text style={s.timingTitle}>Full Time</Text>
            <Switch value={fullEnabled} onValueChange={setFullEnabled} trackColor={{ true: colors.primary }} />
          </View>
          {fullEnabled && (
            <View>
              <Text style={s.timingDetail}>{lib?.fullTime?.from} - {lib?.fullTime?.to}</Text>
              <View style={s.feeRow}>
                <Text style={s.feeLabel}>₹</Text>
                <TextInput style={s.feeInput} value={fullFee} onChangeText={setFullFee} keyboardType="number-pad" />
                <Text style={s.feeLabel}>/month</Text>
              </View>
            </View>
          )}
        </View>
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  totalText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  legend: { fontSize: 12, color: colors.textSecondary },
  grid: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white, marginHorizontal: 16, borderRadius: 12 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 14, gap: 10 },
  sumCard: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  sumVal: { fontSize: 24, fontWeight: 'bold' },
  sumLbl: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  saveBtn: { backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  timingSection: { paddingHorizontal: 16, marginTop: 24 },
  secTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  timingCard: { backgroundColor: colors.white, borderRadius: 10, padding: 16, marginBottom: 12 },
  timingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timingTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  timingDetail: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  feeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  feeLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  feeInput: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder, marginHorizontal: 6, fontSize: 18, fontWeight: '700', color: colors.primary, minWidth: 60, textAlign: 'center', paddingVertical: 2 },
});
