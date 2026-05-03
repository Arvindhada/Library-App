import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch, Image, StatusBar, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../../src/context/AppContext';

// ── Colors ──
const C = {
  bg: '#F5F3EE',
  surface: '#FFFFFF',
  primary: '#0F6E56',
  primaryLight: '#E8F5F0',
  primaryBorder: '#9FE1CB',
  textDark: '#1A1C1B',
  textGray: '#6F7A74',
  border: '#D1CFCA',
  red: '#DC2626',
  orange: '#C2410C',
};

export default function OwnerProfile() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const {
    ownerData, setOwnerData,
    currentLibrary, currentBookings,
    students, payments,
    setUserRole,
  } = useApp();

  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(ownerData?.name || '');
  const [phone, setPhone]       = useState(ownerData?.phone || '');
  const [notifs, setNotifs]     = useState(true);

  const getInitials = (n) =>
    n ? n.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : 'O';

  // Stats — use both local dummy + real bookings
  const totalStudents = currentBookings.length > 0
    ? currentBookings.filter(b => b.status === 'Active').length
    : students.length;
  const totalRevenue = payments.reduce((a, b) => a + (b.amount || b.fee || 0), 0);
  const pendingCount = currentBookings.filter(b => b.status === 'Pending').length;

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setOwnerData(prev => ({ ...prev, name: name.trim(), phone: phone.trim() }));
    setEditing(false);
    Alert.alert('✅ Saved!', 'Profile updated successfully.');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userRole');
          setUserRole(null);
          router.replace('/owner/login');
        }
      },
    ]);
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── PROFILE HEADER ── */}
        <View style={s.profileCard}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            {ownerData?.photo ? (
              <Image source={{ uri: ownerData.photo }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{getInitials(editing ? name : ownerData?.name)}</Text>
              </View>
            )}
            <View style={s.onlineDot} />
          </View>

          {/* Name + Phone */}
          {editing ? (
            <View style={s.editBox}>
              <TextInput
                style={s.editInput}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
                placeholderTextColor={C.textGray}
                autoFocus
              />
              <TextInput
                style={s.editInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone Number"
                placeholderTextColor={C.textGray}
                keyboardType="phone-pad"
              />
              <View style={s.editBtnRow}>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                  <Text style={s.saveBtnTxt}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setName(ownerData?.name || ''); setPhone(ownerData?.phone || ''); setEditing(false); }} activeOpacity={0.8}>
                  <Text style={s.cancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.nameBox}>
              <Text style={s.ownerName}>{ownerData?.name || 'Library Owner'}</Text>
              <Text style={s.ownerPhone}>
                <Ionicons name="call-outline" size={13} color={C.textGray} /> +91 {ownerData?.phone || 'N/A'}
              </Text>
              <TouchableOpacity style={s.editBadge} onPress={() => setEditing(true)} activeOpacity={0.8}>
                <Ionicons name="create-outline" size={13} color={C.primary} />
                <Text style={s.editBadgeTxt}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── LIBRARY CARD ── */}
        {currentLibrary && (
          <TouchableOpacity
            style={s.libCard}
            onPress={() => router.push('/owner/edit-library')}
            activeOpacity={0.9}
          >
            <View style={s.libIconWrap}>
              <Ionicons name="business-outline" size={22} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.libName}>{currentLibrary.name}</Text>
              <Text style={s.libAddr} numberOfLines={1}>
                {currentLibrary.address || 'Tap to view details'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textGray} />
          </TouchableOpacity>
        )}

        {/* ── 3 STATS ── */}
        <View style={s.statsRow}>
          <View style={[s.statBox, { backgroundColor: C.primaryLight, borderColor: C.primaryBorder }]}>
            <Text style={[s.statVal, { color: C.primary }]}>{totalStudents}</Text>
            <Text style={[s.statLbl, { color: '#085041' }]}>Students</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
            <Text style={s.statLbl}>Revenue</Text>
          </View>
          <View style={[s.statBox, pendingCount > 0 && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
            <Text style={[s.statVal, pendingCount > 0 && { color: C.red }]}>{pendingCount}</Text>
            <Text style={[s.statLbl, pendingCount > 0 && { color: '#991B1B' }]}>Pending</Text>
          </View>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          <TouchableOpacity style={s.actionCard} onPress={() => router.push('/owner/tabs/students')} activeOpacity={0.85}>
            <View style={[s.actionIcon, { backgroundColor: C.primaryLight }]}>
              <Ionicons name="people-outline" size={22} color={C.primary} />
            </View>
            <Text style={s.actionTxt}>Manage Students</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionCard} onPress={() => router.push('/owner/seat-manager')} activeOpacity={0.85}>
            <View style={[s.actionIcon, { backgroundColor: '#FFF3E8' }]}>
              <Ionicons name="grid-outline" size={22} color={C.orange} />
            </View>
            <Text style={s.actionTxt}>Seat Manager</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionCard} onPress={() => router.push('/owner/revenue')} activeOpacity={0.85}>
            <View style={[s.actionIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="bar-chart-outline" size={22} color="#16A34A" />
            </View>
            <Text style={s.actionTxt}>Revenue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionCard} onPress={() => router.push('/owner/edit-library')} activeOpacity={0.85}>
            <View style={[s.actionIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="settings-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={s.actionTxt}>Library Settings</Text>
          </TouchableOpacity>
        </View>

        {/* ── SETTINGS ── */}
        <Text style={s.sectionTitle}>Settings</Text>
        <View style={s.menuCard}>

          {/* Notifications toggle */}
          <View style={s.menuItem}>
            <View style={[s.menuIcon, { backgroundColor: C.primaryLight }]}>
              <Ionicons name="notifications-outline" size={20} color={C.primary} />
            </View>
            <Text style={s.menuTxt}>Push Notifications</Text>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              thumbColor="#FFF"
              trackColor={{ false: '#D1CFCA', true: C.primary }}
            />
          </View>

          <View style={s.divider} />

          {/* My Library */}
          <TouchableOpacity style={s.menuItem} onPress={() => router.push('/owner/edit-library')} activeOpacity={0.8}>
            <View style={[s.menuIcon, { backgroundColor: C.primaryLight }]}>
              <Ionicons name="business-outline" size={20} color={C.primary} />
            </View>
            <Text style={s.menuTxt}>My Library Details</Text>
            <Ionicons name="chevron-forward" size={18} color={C.textGray} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Help & Support */}
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => Linking.openURL('https://wa.me/919800000000?text=Hi, I need help with LibConnect')}
            activeOpacity={0.8}
          >
            <View style={[s.menuIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
            </View>
            <Text style={s.menuTxt}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color={C.textGray} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Terms */}
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => Alert.alert('Terms & Privacy', 'By using LibConnect, you agree to our Terms of Service and Privacy Policy.\n\nFor queries: support@libconnect.in')}
            activeOpacity={0.8}
          >
            <View style={[s.menuIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={s.menuTxt}>Terms & Privacy</Text>
            <Ionicons name="chevron-forward" size={18} color={C.textGray} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Rate App */}
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => Alert.alert('Rate Us ⭐', 'Thank you for using LibConnect!')}
            activeOpacity={0.8}
          >
            <View style={[s.menuIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star-outline" size={20} color="#D97706" />
            </View>
            <Text style={s.menuTxt}>Rate the App</Text>
            <Ionicons name="chevron-forward" size={18} color={C.textGray} />
          </TouchableOpacity>
        </View>

        {/* ── APP INFO ── */}
        <View style={s.appInfo}>
          <Text style={s.appVersion}>LibConnect v1.0.0</Text>
          <Text style={s.appSub}>Made with ❤️ for Library Owners</Text>
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={C.red} />
          <Text style={s.logoutTxt}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  // Profile Card
  profileCard: {
    backgroundColor: C.surface, borderRadius: 20, borderWidth: 0.5, borderColor: C.border,
    padding: 20, alignItems: 'center', marginBottom: 14,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarImg: { width: 80, height: 80, borderRadius: 40, borderWidth: 2.5, borderColor: C.primaryBorder },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.primaryLight, borderWidth: 2.5, borderColor: C.primaryBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 30, fontWeight: '800', color: C.primary },
  onlineDot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#16A34A',
    position: 'absolute', bottom: 2, right: 2, borderWidth: 2.5, borderColor: C.surface,
  },
  nameBox: { alignItems: 'center', gap: 6 },
  ownerName: { color: C.textDark, fontSize: 22, fontWeight: '700' },
  ownerPhone: { color: C.textGray, fontSize: 14, fontWeight: '500' },
  editBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primaryLight, borderRadius: 20, borderWidth: 0.5, borderColor: C.primaryBorder,
    paddingHorizontal: 14, paddingVertical: 7, marginTop: 6,
  },
  editBadgeTxt: { color: C.primary, fontSize: 13, fontWeight: '700' },

  // Edit mode
  editBox: { width: '100%', gap: 10 },
  editInput: {
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.textDark,
  },
  editBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12 },
  saveBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, paddingVertical: 12, alignItems: 'center' },
  cancelBtnTxt: { color: C.textGray, fontSize: 14, fontWeight: '600' },

  // Library card
  libCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border,
    padding: 14, marginBottom: 14,
  },
  libIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  libName: { color: C.textDark, fontSize: 15, fontWeight: '700' },
  libAddr: { color: C.textGray, fontSize: 12, marginTop: 2 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, padding: 14, alignItems: 'center' },
  statVal: { color: C.textDark, fontSize: 20, fontWeight: '800' },
  statLbl: { color: C.textGray, fontSize: 11, fontWeight: '600', marginTop: 4 },

  // Section title
  sectionTitle: { color: C.textGray, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  // Quick Actions Grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  actionCard: {
    width: '47%', backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border,
    padding: 16, alignItems: 'flex-start', gap: 10,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionTxt: { color: C.textDark, fontSize: 13, fontWeight: '700' },

  // Menu
  menuCard: {
    backgroundColor: C.surface, borderRadius: 18, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 20,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTxt: { flex: 1, fontSize: 15, fontWeight: '600', color: C.textDark },
  divider: { height: 0.5, backgroundColor: C.border },

  // App info
  appInfo: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  appVersion: { color: C.textGray, fontSize: 13, fontWeight: '600' },
  appSub: { color: C.textGray, fontSize: 12 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FEE2E2', borderRadius: 16, borderWidth: 0.5, borderColor: '#FCA5A5',
    paddingVertical: 15, marginBottom: 10,
  },
  logoutTxt: { fontSize: 16, fontWeight: '700', color: C.red },
});
