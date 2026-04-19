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
  const { getOwnerLibrary, updateLibrarySeats, students } = useApp();
  const lib = getOwnerLibrary();

  const [totalInput, setTotalInput] = useState(String(lib?.totalSeats || 80));
  
  // Create grid based on total seats, mapping students to their seat numbers
  const total = parseInt(totalInput, 10) || 80;
  const todayStr = new Date().toISOString().split('T')[0];
  
  const seats = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= total; i++) {
      const student = students.find((s) => parseInt(s.seat, 10) === i);
      const isFeeDue = student ? student.expiry < todayStr : false;
      arr.push({
        number: i,
        booked: !!student,
        studentName: student?.name,
        studentPhone: student?.phone,
        studentExpiry: student?.expiry,
        studentPlan: student?.plan,
        isFeeDue,
      });
    }
    return arr;
  }, [total, students, todayStr]);

  const vacant = seats.filter((s) => !s.booked).length;
  const booked = seats.filter((s) => s.booked).length;

  const handleGenerateGrid = () => {
    const num = parseInt(totalInput, 10);
    if (!num || num < 1 || num > 500) {
      Alert.alert('Error', 'Enter a valid number (1-500)');
      return;
    }
    updateLibrarySeats(lib.id, num - booked, booked);
    Alert.alert('Updated', `Library capacity updated to ${num} seats`);
  };

  const onSeatPress = (seat) => {
    if (seat.booked) {
      const statusText = seat.isFeeDue
        ? `\n⚠️ Fee Status: Due (Expired: ${seat.studentExpiry})`
        : `\n✅ Fee Status: Paid (Exp: ${seat.studentExpiry})`;
      Alert.alert(
        `Seat ${seat.number} — ${seat.studentName}`,
        `Plan: ${seat.studentPlan}${statusText}`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Manage Student', onPress: () => router.push('/owner/manage-students') },
        ]
      );
    } else {
      Alert.alert('Vacant Seat', `Seat ${seat.number} is available.\nGo to Manage Students to assign it.`);
    }
  };

  const saveChanges = () => {
    updateLibrarySeats(lib.id, vacant, booked);
    router.back();
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
              <View style={[s.legendDot, { backgroundColor: colors.warning, marginLeft: 12 }]} /><Text style={s.legendText}>Fee Due</Text>
            </View>
          </View>

          {/* Seat Grid */}
          <View style={s.grid}>
            <FlatList
              data={seats}
              keyExtractor={(_, i) => String(i)}
              numColumns={8}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <SeatBox
                  seatNumber={item.number}
                  isBooked={item.booked}
                  isFeeDue={item.isFeeDue}
                  onPress={() => onSeatPress(item)}
                />
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
