import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import colors from '../constants/colors';

// SeatBox: A single seat in the grid — green = available, red = booked
const SeatBox = ({ seatNumber, isBooked, onPress }) => (
  <TouchableOpacity
    testID={`seat-${seatNumber}`}
    style={[s.box, isBooked ? s.booked : s.available]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={s.num}>{seatNumber}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  box: { width: 40, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center', margin: 3 },
  available: { backgroundColor: colors.success },
  booked: { backgroundColor: colors.danger },
  num: { fontSize: 11, fontWeight: '700', color: colors.white },
});

export default SeatBox;
