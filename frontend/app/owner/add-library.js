import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../src/constants/colors';
export default function AddLibrary() {
  return <View style={s.c}><Text style={s.t}>Add/Edit Library — Coming soon</Text></View>;
}
const s = StyleSheet.create({ c: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgLight }, t: { color: colors.textSecondary } });
