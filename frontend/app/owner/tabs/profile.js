import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';

export default function OwnerProfile() {
  const router = useRouter();
  const { ownerData, setOwnerData, setUserRole } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ownerData.name);
  const [phone, setPhone] = useState(ownerData.phone);
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { setUserRole(null); router.replace('/'); } },
    ]);
  };

  const handleSaveProfile = () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setOwnerData(prev => ({ ...prev, name: name.trim(), phone: phone.trim() }));
    setEditing(false);
    Alert.alert('Saved!', 'Profile updated successfully.');
  };

  const handleCancelEdit = () => {
    setName(ownerData.name);
    setPhone(ownerData.phone);
    setEditing(false);
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}><Text style={s.heading}>Profile</Text></View>

      {/* Avatar & Info */}
      <View style={s.profileCard}>
        <View style={s.avatar}><Ionicons name="person" size={36} color={colors.white} /></View>
        {editing ? (
          <View style={s.editFields}>
            <TextInput style={s.editInput} value={name} onChangeText={setName} placeholder="Your Name" />
            <TextInput style={s.editInput} value={phone} onChangeText={setPhone} placeholder="Phone Number" keyboardType="phone-pad" />
            <View style={s.editBtns}>
              <TouchableOpacity style={s.saveBtn} onPress={handleSaveProfile}>
                <Text style={s.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={handleCancelEdit}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={s.name}>{ownerData.name}</Text>
            <Text style={s.phone}>+91 {ownerData.phone}</Text>
            <TouchableOpacity style={s.editProfileBtn} onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={s.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Menu Items */}
      <View style={s.menuSection}>
        <View style={s.menuItem}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          <Text style={s.menuText}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            thumbColor={notifications ? colors.primary : '#ccc'}
            trackColor={{ false: '#e0e0e0', true: colors.primary + '50' }}
          />
        </View>

        <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('Help & Support', 'For help, contact us at:\nsupport@libconnect.in\n\nWhatsApp: +91 9800000000')}>
          <Ionicons name="help-circle-outline" size={22} color={colors.textPrimary} />
          <Text style={s.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('Terms & Privacy', 'By using LibConnect, you agree to our Terms of Service and Privacy Policy.')}>
          <Ionicons name="document-text-outline" size={22} color={colors.textPrimary} />
          <Text style={s.menuText}>Terms & Privacy</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity testID="logout-btn" style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  profileCard: { alignItems: 'center', backgroundColor: colors.white, paddingVertical: 24, paddingHorizontal: 20, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  phone: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.primary },
  editProfileText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  editFields: { width: '100%' },
  editInput: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 10, backgroundColor: colors.bgLight },
  editBtns: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 15 },
  menuSection: { backgroundColor: colors.white, marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.bgLight },
  menuText: { flex: 1, fontSize: 15, color: colors.textPrimary, marginLeft: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.danger },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.danger, marginLeft: 8 },
});
