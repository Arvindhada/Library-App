import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

// SeatBox: green = available, orange = booked (fee due), red = booked (paid)
const SeatBox = ({ seatNumber, isBooked, isFeeDue, onPress }) => {
  const bgColor = !isBooked
    ? colors.success
    : isFeeDue
    ? colors.warning  // Orange = fee due
    : colors.danger;  // Red = booked & paid

  return (
    <TouchableOpacity
      testID={`seat-${seatNumber}`}
      style={[s.box, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={s.num}>{seatNumber}</Text>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  box: { width: 40, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center', margin: 3 },
  num: { fontSize: 11, fontWeight: '700', color: colors.white },
});

export default SeatBox;
