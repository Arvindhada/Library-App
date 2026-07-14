import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const SeatBox = ({ seatLabel, isBooked, isExpiring, isSelected, onPress, size = 40 }) => {
  let boxStyle = s.freeBox;
  let textStyle = s.freeText;

  if (isBooked) {
    if (isExpiring) {
      boxStyle = s.expiringBox;
      textStyle = s.expiringText;
    } else {
      boxStyle = s.occupiedBox;
      textStyle = s.occupiedText;
    }
  }

  // Adjust font size dynamically for 3-digit numbers
  const fontSize = seatLabel.length > 2 ? 9 : (size < 36 ? 10 : 12);

  return (
    <TouchableOpacity
      testID={`seat-${seatLabel}`}
      style={[
        s.box,
        boxStyle,
        isSelected && s.selectedBox,
        { width: size, height: size, borderRadius: size * 0.2 }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[s.num, textStyle, { fontSize }]}>{seatLabel}</Text>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  box: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 1,
  },
  freeBox: {
    backgroundColor: '#E8F5F0', // C.primaryLight
    borderColor: '#0F6E56',     // C.primary
  },
  freeText: {
    color: '#0F6E56',           // C.primary
  },
  occupiedBox: {
    backgroundColor: '#0F6E56', // C.primary
    borderColor: '#0F6E56',
  },
  occupiedText: {
    color: '#FFFFFF',
  },
  expiringBox: {
    backgroundColor: '#FFF3E8', // C.orangeLight
    borderColor: '#C2410C',     // C.orange
  },
  expiringText: {
    color: '#C2410C',           // C.orange
  },
  selectedBox: {
    borderColor: '#0F6E56',     // Highlight selection using primary green
    borderWidth: 2,
    shadowColor: '#0F6E56',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  num: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SeatBox;
