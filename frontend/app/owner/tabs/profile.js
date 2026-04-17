import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';

export default function OwnerProfile() {
  const router = useRouter();
  const { ownerData, setUserRole } = useApp();

  const handleLogout = () => {
    setUserRole(null);
    router.replace('/');
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}><Text style={s.heading}>Profile</Text></View>

      <View style={s.profileCard}>
        <View style={s.avatar}><Ionicons name="person" size={36} color={colors.white} /></View>
        <Text style={s.name}>{ownerData.name}</Text>
        <Text style={s.phone}>+91 {ownerData.phone}</Text>
      </View>

      <TouchableOpacity style={s.menuItem}><Ionicons name="create-outline" size={22} color={colors.textPrimary} /><Text style={s.menuText}>Edit Profile</Text><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></TouchableOpacity>
      <TouchableOpacity style={s.menuItem}><Ionicons name="notifications-outline" size={22} color={colors.textPrimary} /><Text style={s.menuText}>Notifications</Text><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></TouchableOpacity>
      <TouchableOpacity style={s.menuItem}><Ionicons name="help-circle-outline" size={22} color={colors.textPrimary} /><Text style={s.menuText}>Help & Support</Text><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></TouchableOpacity>
      <TouchableOpacity style={s.menuItem}><Ionicons name="document-text-outline" size={22} color={colors.textPrimary} /><Text style={s.menuText}>Terms & Privacy</Text><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></TouchableOpacity>

      <TouchableOpacity testID="logout-btn" style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  profileCard: { alignItems: 'center', backgroundColor: colors.white, paddingVertical: 24, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  phone: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.bgLight },
  menuText: { flex: 1, fontSize: 15, color: colors.textPrimary, marginLeft: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 24, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.danger },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.danger, marginLeft: 8 },
});
