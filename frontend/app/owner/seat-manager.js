import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../src/constants/colors';
export default function SeatManager() {
  return <View style={s.c}><Text style={s.t}>Seat Manager — redirected to Dashboard</Text></View>;
}
const s = StyleSheet.create({ c: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgLight }, t: { color: colors.textSecondary } });
