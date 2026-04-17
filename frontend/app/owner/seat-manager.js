// Seat Manager — Full rewrite with dynamic total seats input and grid
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';
import SeatBox from '../../src/components/SeatBox';

export default function SeatManager() {
  const router = useRouter();
  const { getOwnerLibrary, updateLibrarySeats } = useApp();
  const lib = getOwnerLibrary();

  const [totalInput, setTotalInput] = useState(String(lib?.totalSeats || 80));
  const [seats, setSeats] = useState(() => {
    const total = lib?.totalSeats || 80;
    const booked = lib?.bookedSeats || 0;
    const arr = [];
    for (let i = 0; i < total; i++) arr.push(i < booked);
    return arr;
  });

  const vacant = useMemo(() => seats.filter((s) => !s).length, [seats]);
  const booked = useMemo(() => seats.filter((s) => s).length, [seats]);

  // Generate new grid when total changes
  const handleGenerateGrid = () => {
    const num = parseInt(totalInput, 10);
    if (!num || num < 1 || num > 500) {
      Alert.alert('Error', 'Enter a valid number (1-500)');
      return;
    }
    const arr = [];
    for (let i = 0; i < num; i++) arr.push(false); // all available
    setSeats(arr);
  };

  const toggleSeat = (idx) => {
    setSeats((prev) => { const n = [...prev]; n[idx] = !n[idx]; return n; });
  };

  const saveChanges = () => {
    updateLibrarySeats(lib.id, vacant, booked);
    Alert.alert('Saved!', `Total: ${seats.length}, Vacant: ${vacant}, Booked: ${booked}`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity testID="seat-mgr-back" onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.heading}>Seat Manager</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Total Seats Input */}
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Enter Total Seats</Text>
            <View style={s.inputRow}>
              <TextInput
                testID="total-seats-input"
                style={s.input}
                value={totalInput}
                onChangeText={setTotalInput}
                keyboardType="number-pad"
                placeholder="e.g. 80"
                maxLength={3}
              />
              <TouchableOpacity testID="generate-grid-btn" style={s.genBtn} onPress={handleGenerateGrid}>
                <Text style={s.genBtnText}>Generate Grid</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legend */}
          <View style={s.legendRow}>
            <Text style={s.totalText}>Total: {seats.length} Seats</Text>
            <View style={s.legendRight}>
              <View style={[s.legendDot, { backgroundColor: colors.success }]} /><Text style={s.legendText}>Available</Text>
              <View style={[s.legendDot, { backgroundColor: colors.danger, marginLeft: 12 }]} /><Text style={s.legendText}>Booked</Text>
            </View>
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

          {/* Counts */}
          <View style={s.countRow}>
            <View style={[s.countCard, { backgroundColor: colors.success + '15' }]}>
              <Text style={[s.countVal, { color: colors.success }]}>{vacant}</Text>
              <Text style={s.countLbl}>Available</Text>
            </View>
            <View style={[s.countCard, { backgroundColor: colors.danger + '15' }]}>
              <Text style={[s.countVal, { color: colors.danger }]}>{booked}</Text>
              <Text style={s.countLbl}>Booked</Text>
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity testID="save-seats-btn" style={s.saveBtn} onPress={saveChanges}>
            <Text style={s.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white },
  backBtn: { padding: 4 },
  heading: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  inputCard: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
  inputLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontWeight: '700', color: colors.textPrimary, backgroundColor: colors.bgLight },
  genBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, borderRadius: 10, justifyContent: 'center' },
  genBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  totalText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  legendRight: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 3, marginRight: 4 },
  legendText: { fontSize: 12, color: colors.textSecondary },
  grid: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white, marginHorizontal: 16, borderRadius: 12 },
  countRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 14, gap: 10 },
  countCard: { flex: 1, borderRadius: 10, padding: 16, alignItems: 'center' },
  countVal: { fontSize: 28, fontWeight: 'bold' },
  countLbl: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  saveBtn: { backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 18, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
