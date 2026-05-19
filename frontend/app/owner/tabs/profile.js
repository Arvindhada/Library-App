import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch, Image, StatusBar, Linking, ActivityIndicator, Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../../src/context/AppContext';
import { API_ENDPOINTS } from '../../../src/services/apiConfig';
import { updateLibrary } from '../../../src/services/libraryService';

const C = {
  bg: '#F5F3EE', surface: '#FFFFFF', primary: '#0F6E56',
  primaryLight: '#E8F5F0', primaryBorder: '#9FE1CB',
  textDark: '#1A1C1B', textGray: '#6F7A74', border: '#D1CFCA',
  red: '#DC2626', orange: '#C2410C',
};

export default function OwnerProfile() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { ownerData, setOwnerData, currentLibrary, currentBookings, pendingBookings, revenue, fetchDashboardData, logout } = useApp();

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [notifs,  setNotifs]  = useState(true);
  const [imageUri, setImageUri] = useState(null);

  // Owner fields
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (ownerData && !editing) {
      setName(ownerData.name || '');
      let rawPhone = ownerData.phone || '';
      if (rawPhone.startsWith('+91')) rawPhone = rawPhone.replace('+91', '');
      setPhone(rawPhone);
    }
  }, [ownerData, editing]);

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : 'O';

  const totalStudents = (currentBookings || []).filter(b => b.status === 'Active').length;
  const totalRevenue  = revenue?.thisMonth || 0;
  const pendingCount  = (pendingBookings || []).length;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const uploadImage = async (uri) => {
    const token = await AsyncStorage.getItem('userToken');
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      formData.append('image', blob, 'profile_photo.jpg');
    } else {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      formData.append('image', { uri, name: filename, type: match ? `image/${match[1]}` : 'image/jpeg' });
    }
    
    const response = await fetch(API_ENDPOINTS.UPLOAD, {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${token}` } // DO NOT manually set Content-Type!
    });
    
    const data = await response.json();
    if (data?.success) return data.url;
    throw new Error('Upload failed');
  };

  const handleSave = async () => {
    const trimmedPhone = phone.trim();
    if (trimmedPhone.length > 0 && trimmedPhone.length !== 10) {
      const msg = 'Phone number must be exactly 10 digits';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Error', msg);
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Session expired. Please login again.');
        setSaving(false);
        return;
      }

      let photoUrl = ownerData?.photo;
      if (imageUri) photoUrl = await uploadImage(imageUri);

      // Build payload — only include fields that have values
      const payload = {};
      if (name.trim()) payload.name = name.trim();
      if (trimmedPhone) payload.phone = trimmedPhone;
      if (photoUrl) payload.photo = photoUrl;

      console.log('[Profile Save] Sending payload:', payload);
      console.log('[Profile Save] Token exists:', !!token);
      console.log('[Profile Save] URL:', API_ENDPOINTS.USERS + '/profile');

      const profileRes = await axios.put(
        API_ENDPOINTS.USERS + '/profile',
        payload,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      console.log('[Profile Save] Response:', profileRes.data);

      if (profileRes.data.success) {
        setOwnerData(profileRes.data.user);
        await fetchDashboardData();
        setEditing(false);
        setImageUri(null);
        if (Platform.OS === 'web') window.alert('Profile updated successfully!');
        else Alert.alert('✅ Saved!', 'Profile updated successfully.');
      }
    } catch (e) {
      console.error('[Profile Save] Error:', e.response?.data || e.message);
      const msg = e.response?.data?.message || e.message || 'Could not save. Check your connection.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Save Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifs = async (value) => {
    if (value) {
      // Simulate permission request
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        setNotifs(true);
        if (Platform.OS === 'web') {
          window.alert('Notifications Enabled! You will now receive alerts for new bookings and payments.');
        } else {
          Alert.alert('🔔 Notifications Enabled', 'You will now receive alerts for new bookings and payments.');
        }
      }, 1000);
    } else {
      setNotifs(false);
    }
  };

  const handleCancel = () => {
    setName(ownerData?.name || '');
    let rawPhone = ownerData?.phone || '';
    if (rawPhone.startsWith('+91')) rawPhone = rawPhone.replace('+91', '');
    setPhone(rawPhone);
    setImageUri(null);
    setEditing(false);
  };

  const handleLogout = () => {
    const msg = 'Kya aap logout karna chahte hain?';
    if (Platform.OS === 'web') { if (window.confirm(msg)) logout(router); }
    else Alert.alert('Logout', msg, [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: () => logout(router) }]);
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── PROFILE HEADER ── */}
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <TouchableOpacity activeOpacity={editing ? 0.7 : 1} onPress={editing ? pickImage : null} style={s.avatarTouchable}>
              {(imageUri || ownerData?.photo) ? (
                <Image source={{ uri: imageUri || ownerData.photo }} style={s.avatarImg} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarInitial}>{getInitials(editing ? name : ownerData?.name)}</Text>
                </View>
              )}
              {editing && <View style={s.editImageOverlay}><Ionicons name="camera" size={20} color="#FFF" /></View>}
            </TouchableOpacity>
            {!editing && <View style={s.onlineDot} />}
          </View>

          {editing ? (
            // ──── EDIT MODE ────
            <View style={s.editBox}>
              <TextInput style={s.editInput} value={name} onChangeText={setName} placeholder="Your Name" placeholderTextColor={C.textGray} autoFocus />
              <TextInput style={s.editInput} value={phone} onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
                placeholder="Phone Number (10 digits)" placeholderTextColor={C.textGray} keyboardType="phone-pad" maxLength={10} />
              <View style={s.editBtnRow}>
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#FFF" /> : <><Ionicons name="checkmark" size={16} color="#FFF" /><Text style={s.saveBtnTxt}>Save</Text></>}
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                  <Text style={s.cancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // ──── VIEW MODE ────
            <View style={s.nameBox}>
              <Text style={s.ownerName}>{ownerData?.name || 'Library Owner'}</Text>
              
              {(ownerData?.authProvider === 'google' || ownerData?.email) ? (
                <Text style={s.ownerPhone}>
                  <Ionicons name="mail-outline" size={13} color={C.textGray} /> {ownerData.email}
                </Text>
              ) : null}

              {ownerData?.phone ? (
                <Text style={s.ownerPhone}>
                  <Ionicons name="call-outline" size={13} color={C.textGray} /> +91 {ownerData.phone.replace('+91', '')}
                </Text>
              ) : null}

              {!ownerData?.phone && !ownerData?.email && (
                <Text style={s.ownerPhone}>
                  <Ionicons name="alert-circle-outline" size={13} color={C.textGray} /> No contact info
                </Text>
              )}

              <TouchableOpacity style={s.editBadge} onPress={() => setEditing(true)} activeOpacity={0.8}>
                <Ionicons name="create-outline" size={13} color={C.primary} />
                <Text style={s.editBadgeTxt}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>



        {/* ── STATS ── */}
        {!editing && (
          <View style={s.statsRow}>
            <TouchableOpacity 
              style={[s.statBox, { backgroundColor: C.primaryLight, borderColor: C.primaryBorder }]}
              onPress={() => router.push('/owner/tabs/students')}
              activeOpacity={0.8}
            >
              <Text style={[s.statVal, { color: C.primary }]}>{totalStudents}</Text>
              <Text style={[s.statLbl, { color: '#085041' }]}>Students</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={s.statBox}
              onPress={() => router.push('/owner/revenue-reports')}
              activeOpacity={0.8}
            >
              <Text style={s.statVal}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
              <Text style={s.statLbl}>Revenue</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.statBox, pendingCount > 0 && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
              onPress={() => router.push('/owner/tabs/requests')}
              activeOpacity={0.8}
            >
              <Text style={[s.statVal, pendingCount > 0 && { color: C.red }]}>{pendingCount}</Text>
              <Text style={[s.statLbl, pendingCount > 0 && { color: '#991B1B' }]}>Pending</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── QUICK ACTIONS ── */}
        {!editing && <>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionsGrid}>
            <TouchableOpacity style={s.actionCard} onPress={() => router.push('/owner/tabs/students')} activeOpacity={0.85}>
              <View style={[s.actionIcon, { backgroundColor: C.primaryLight }]}><Ionicons name="people-outline" size={22} color={C.primary} /></View>
              <Text style={s.actionTxt}>Manage Students</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionCard} onPress={() => router.push('/owner/seat-manager')} activeOpacity={0.85}>
              <View style={[s.actionIcon, { backgroundColor: '#FFF3E8' }]}><Ionicons name="grid-outline" size={22} color={C.orange} /></View>
              <Text style={s.actionTxt}>Seat Manager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionCard} onPress={() => router.push('/owner/revenue-reports')} activeOpacity={0.85}>
              <View style={[s.actionIcon, { backgroundColor: '#DCFCE7' }]}><Ionicons name="bar-chart-outline" size={22} color="#16A34A" /></View>
              <Text style={s.actionTxt}>Revenue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionCard} onPress={() => router.push('/owner/edit-library')} activeOpacity={0.85}>
              <View style={[s.actionIcon, { backgroundColor: '#EFF6FF' }]}><Ionicons name="business-outline" size={22} color="#3B82F6" /></View>
              <Text style={s.actionTxt}>Edit Library</Text>
            </TouchableOpacity>
          </View>
        </>}

        {/* ── SETTINGS ── */}
        {!editing && <>
          <Text style={s.sectionTitle}>Settings</Text>
          <View style={s.menuCard}>
            <View style={s.menuItem}>
              <View style={[s.menuIcon, { backgroundColor: C.primaryLight }]}><Ionicons name="notifications-outline" size={20} color={C.primary} /></View>
              <Text style={s.menuTxt}>Push Notifications</Text>
              <Switch 
                value={notifs} 
                onValueChange={toggleNotifs} 
                thumbColor="#FFF" 
                trackColor={{ false: '#D1CFCA', true: C.primary }} 
              />
            </View>
            <View style={s.divider} />
            <TouchableOpacity style={s.menuItem} onPress={() => router.push('/owner/help-support')} activeOpacity={0.8}>
              <View style={[s.menuIcon, { backgroundColor: '#DCFCE7' }]}><Ionicons name="headset-outline" size={20} color="#16A34A" /></View>
              <Text style={s.menuTxt}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textGray} />
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.menuItem} onPress={() => router.push('/owner/terms-privacy')} activeOpacity={0.8}>
              <View style={[s.menuIcon, { backgroundColor: '#EFF6FF' }]}><Ionicons name="document-text-outline" size={20} color="#3B82F6" /></View>
              <Text style={s.menuTxt}>Terms & Privacy</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textGray} />
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.menuItem} onPress={() => router.push('/owner/rate-app')} activeOpacity={0.8}>
              <View style={[s.menuIcon, { backgroundColor: '#FEF3C7' }]}><Ionicons name="star-outline" size={20} color="#D97706" /></View>
              <Text style={s.menuTxt}>Rate the App</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textGray} />
            </TouchableOpacity>
          </View>
        </>}

        {/* ── APP INFO ── */}
        {!editing && (
          <View style={s.appInfo}>
            <Text style={s.appVersion}>LibConnect v1.0.0</Text>
            <Text style={s.appSub}>Made with ❤️ for Library Owners</Text>
          </View>
        )}

        {/* ── LOGOUT ── */}
        {!editing && (
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={C.red} />
            <Text style={s.logoutTxt}>Logout</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  profileCard: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 0.5, borderColor: C.border, padding: 20, alignItems: 'center', marginBottom: 14 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarTouchable: { position: 'relative' },
  avatarImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: C.primaryBorder },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryLight, borderWidth: 3, borderColor: C.primaryBorder, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: C.primary },
  editImageOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: C.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: C.surface },
  onlineDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#16A34A', position: 'absolute', bottom: 4, right: 4, borderWidth: 3, borderColor: C.surface },
  nameBox: { alignItems: 'center', gap: 6 },
  ownerName: { color: C.textDark, fontSize: 22, fontWeight: '700' },
  ownerPhone: { color: C.textGray, fontSize: 14, fontWeight: '500' },
  editBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, borderRadius: 20, borderWidth: 0.5, borderColor: C.primaryBorder, paddingHorizontal: 14, paddingVertical: 7, marginTop: 6 },
  editBadgeTxt: { color: C.primary, fontSize: 13, fontWeight: '700' },

  editBox: { width: '100%', gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 2 },
  editInput: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: C.textDark },
  feeRow: { flexDirection: 'row', gap: 8 },
  feeInput: { flex: 1 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10 },
  toggleTxt: { fontSize: 13, fontWeight: '600', color: C.textDark },
  editBtnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12 },
  saveBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, paddingVertical: 12, alignItems: 'center' },
  cancelBtnTxt: { color: C.textGray, fontSize: 14, fontWeight: '600' },

  libCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, padding: 14, marginBottom: 14 },
  libIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  libName: { color: C.textDark, fontSize: 15, fontWeight: '700' },
  libAddr: { color: C.textGray, fontSize: 12, marginTop: 2 },
  libBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  libBadge: { backgroundColor: C.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  libBadgeTxt: { fontSize: 11, fontWeight: '600', color: C.primary },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, padding: 14, alignItems: 'center' },
  statVal: { color: C.textDark, fontSize: 20, fontWeight: '800' },
  statLbl: { color: C.textGray, fontSize: 11, fontWeight: '600', marginTop: 4 },

  sectionTitle: { color: C.textGray, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  actionCard: { width: '47%', backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, padding: 16, alignItems: 'flex-start', gap: 10 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionTxt: { color: C.textDark, fontSize: 13, fontWeight: '700' },

  menuCard: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTxt: { flex: 1, fontSize: 15, fontWeight: '600', color: C.textDark },
  divider: { height: 0.5, backgroundColor: C.border },

  appInfo: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  appVersion: { color: C.textGray, fontSize: 13, fontWeight: '600' },
  appSub: { color: C.textGray, fontSize: 12 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEE2E2', borderRadius: 16, borderWidth: 0.5, borderColor: '#FCA5A5', paddingVertical: 15, marginBottom: 10 },
  logoutTxt: { fontSize: 16, fontWeight: '700', color: C.red },
});
