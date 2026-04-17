import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';

const FacilityTag = ({ facility }) => {
  const Icon = facility.lib === 'Ionicons' ? Ionicons : facility.lib === 'MaterialIcons' ? MaterialIcons : FontAwesome;
  return (
    <View style={s.tag}>
      <Icon name={facility.icon} size={14} color={colors.primary} />
      <Text style={s.text}>{facility.name}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightOrangeBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  text: { fontSize: 12, color: colors.textPrimary, marginLeft: 5, fontWeight: '500' },
});

export default FacilityTag;
