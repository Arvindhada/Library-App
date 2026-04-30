import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';

export default function OwnerProfile() {
  const router = useRouter();
  const { ownerData, setOwnerData, setUserRole, students, payments } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ownerData.name);
  const [phone, setPhone] = useState(ownerData.phone);
  const [notifications, setNotifications] = useState(true);

  const totalRevenue = payments.reduce((a, b) => a + b.amount, 0);

  const getInitials = (n) => n.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

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

      {/* ── ORANGE HEADER ── */}
      <View style={s.header}>
        <View style={s.avatarCircle}>
          {editing ? (
            <Text style={s.avatarText}>{getInitials(name || 'O')}</Text>
          ) : (
            <Text style={s.avatarText}>{getInitials(ownerData.name)}</Text>
          )}
        </View>

        {editing ? (
          <View style={s.editArea}>
            <TextInput
              style={s.editInput}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <TextInput
              style={s.editInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              placeholderTextColor="rgba(255,255,255,0.6)"
              keyboardType="phone-pad"
            />
            <View style={s.editBtns}>
              <TouchableOpacity style={s.saveInlineBtn} onPress={handleSaveProfile}>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
                <Text style={s.saveInlineText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelInlineBtn} onPress={handleCancelEdit}>
                <Text style={s.cancelInlineText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.profileInfo}>
            <Text style={s.ownerName}>{ownerData.name}</Text>
            <Text style={s.ownerPhone}>📞 +91 {ownerData.phone}</Text>
            <TouchableOpacity style={s.editBadge} onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={14} color={colors.primary} />
              <Text style={s.editBadgeText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.headerCurve} />
      </View>

      {/* ── STATS ROW ── */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statVal}>{students.length}</Text>
          <Text style={s.statLbl}>Students</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statVal, { color: colors.success }]}>₹{totalRevenue.toLocaleString()}</Text>
          <Text style={s.statLbl}>Revenue</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statVal, { color: colors.info }]}>{payments.length}</Text>
          <Text style={s.statLbl}>Payments</Text>
        </View>
      </View>

      {/* ── MENU ── */}
      <View style={s.menuCard}>
        <Text style={s.menuHeader}>Settings</Text>

        <View style={s.menuItem}>
          <View style={[s.menuIcon, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <Text style={s.menuText}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            thumbColor={notifications ? colors.white : '#ccc'}
            trackColor={{ false: '#E5E7EB', true: colors.primary }}
          />
        </View>

        <View style={s.menuDivider} />

        <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('Help & Support', 'For help, contact us at:\nsupport@libconnect.in\n\nWhatsApp: +91 9800000000')}>
          <View style={[s.menuIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={s.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </TouchableOpacity>

        <View style={s.menuDivider} />

        <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('Terms & Privacy', 'By using LibConnect, you agree to our Terms of Service and Privacy Policy.')}>
          <View style={[s.menuIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="document-text-outline" size={20} color="#22C55E" />
          </View>
          <Text style={s.menuText}>Terms & Privacy</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* ── APP VERSION ── */}
      <View style={s.versionBox}>
        <Text style={s.versionText}>LibConnect v1.0.0</Text>
        <Text style={s.versionSub}>Made with ❤️ for Library Owners</Text>
      </View>

      {/* ── LOGOUT ── */}
      <TouchableOpacity testID="logout-btn" style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.white} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // HEADER
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 0, alignItems: 'center' },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: colors.white },
  profileInfo: { alignItems: 'center', paddingBottom: 28, marginTop: 14 },
  ownerName: { fontSize: 22, fontWeight: 'bold', color: colors.white, marginTop: 12 },
  ownerPhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  editBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, marginTop: 14 },
  editBadgeText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  editArea: { width: '85%', paddingBottom: 24, marginTop: 14 },
  editInput: { borderBottomWidth: 1.5, borderBottomColor: 'rgba(255,255,255,0.5)', paddingVertical: 10, fontSize: 16, color: colors.white, marginBottom: 14 },
  editBtns: { flexDirection: 'row', gap: 10, marginTop: 6 },
  saveInlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  saveInlineText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  cancelInlineBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  cancelInlineText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  headerCurve: { height: 28, width: '100%', backgroundColor: '#F9FAFB', borderTopLeftRadius: 28, borderTopRightRadius: 28 },

  // STATS
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20, marginTop: -6 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statVal: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  statLbl: { fontSize: 11, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },

  // MENU
  menuCard: { backgroundColor: colors.white, marginHorizontal: 16, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  menuHeader: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, paddingVertical: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6' },

  // VERSION
  versionBox: { alignItems: 'center', paddingVertical: 16, marginBottom: 16 },
  versionText: { fontSize: 13, color: colors.textLight, fontWeight: '600' },
  versionSub: { fontSize: 12, color: colors.textLight, marginTop: 4 },

  // LOGOUT
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, paddingVertical: 15, borderRadius: 16, backgroundColor: colors.danger, elevation: 2 },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
