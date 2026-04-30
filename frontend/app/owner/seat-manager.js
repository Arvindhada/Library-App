// Seat Manager — Premium Redesign
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
  const feeDue = seats.filter((s) => s.isFeeDue).length;

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

        {/* ── ORANGE HEADER ── */}
        <View style={s.header}>
          <View style={s.headerContent}>
            <TouchableOpacity testID="seat-mgr-back" onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
            <View>
              <Text style={s.heading}>Seat Manager</Text>
              <Text style={s.subHeading}>{lib?.name || 'Your Library'}</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
          <View style={s.headerCurve} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

          {/* ── COUNT PILLS ── */}
          <View style={s.pillRow}>
            <View style={[s.pillCard, { backgroundColor: '#22C55E' }]}>
              <Text style={s.pillVal}>{vacant}</Text>
              <Text style={s.pillLbl}>Available</Text>
            </View>
            <View style={[s.pillCard, { backgroundColor: '#EF4444' }]}>
              <Text style={s.pillVal}>{booked}</Text>
              <Text style={s.pillLbl}>Booked</Text>
            </View>
            <View style={[s.pillCard, { backgroundColor: '#F59E0B' }]}>
              <Text style={s.pillVal}>{feeDue}</Text>
              <Text style={s.pillLbl}>Fee Due</Text>
            </View>
          </View>

          {/* ── CAPACITY INPUT ── */}
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Total Seats Capacity</Text>
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
                <Ionicons name="refresh" size={18} color={colors.white} />
                <Text style={s.genBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── LEGEND ── */}
          <View style={s.legendRow}>
            <Text style={s.legendTitle}>Seat Grid — {seats.length} Seats</Text>
            <View style={s.legendChips}>
              <View style={s.legendChip}>
                <View style={[s.legendDot, { backgroundColor: colors.success }]} />
                <Text style={s.legendText}>Free</Text>
              </View>
              <View style={s.legendChip}>
                <View style={[s.legendDot, { backgroundColor: colors.danger }]} />
                <Text style={s.legendText}>Booked</Text>
              </View>
              <View style={s.legendChip}>
                <View style={[s.legendDot, { backgroundColor: colors.warning }]} />
                <Text style={s.legendText}>Due</Text>
              </View>
            </View>
          </View>

          {/* ── SEAT GRID ── */}
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

          {/* ── SAVE BUTTON ── */}
          <TouchableOpacity testID="save-seats-btn" style={s.saveBtn} onPress={saveChanges}>
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={s.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // HEADER
  header: { backgroundColor: colors.primary, paddingTop: 55, paddingBottom: 0 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 22 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: 'bold', color: colors.white, textAlign: 'center' },
  subHeading: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 2 },
  headerCurve: { height: 28, backgroundColor: '#F9FAFB', borderTopLeftRadius: 28, borderTopRightRadius: 28 },

  // PILLS
  pillRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20, marginTop: -6 },
  pillCard: { flex: 1, height: 74, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  pillVal: { fontSize: 22, fontWeight: 'bold', color: colors.white },
  pillLbl: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  // INPUT CARD
  inputCard: { backgroundColor: colors.white, marginHorizontal: 16, marginBottom: 20, borderRadius: 20, padding: 18, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, backgroundColor: '#F9FAFB', textAlign: 'center' },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 20, borderRadius: 14, justifyContent: 'center', elevation: 2 },
  genBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },

  // LEGEND
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  legendTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  legendChips: { flexDirection: 'row', gap: 10 },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  // GRID
  grid: { paddingHorizontal: 12, paddingVertical: 16, backgroundColor: colors.white, marginHorizontal: 16, borderRadius: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },

  // SAVE
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.primary, marginHorizontal: 16, paddingVertical: 16, borderRadius: 16, elevation: 3 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
