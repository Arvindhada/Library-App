import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';

export default function StudentProfile() {
  const router = useRouter();
  const { studentData, fetchStudentBookings, logout, isDarkMode, setIsDarkMode, theme: tColors } = useApp();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkData = async () => {
      if (!studentData) {
        setLoading(true);
        await fetchStudentBookings();
        setLoading(false);
      }
    };
    checkData();
  }, [studentData]);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, backgroundColor: tColors.bg },
    heading: { fontSize: 28, fontWeight: '800', color: tColors.textDark },
    
    profileCard: { marginHorizontal: 24, marginTop: 8, marginBottom: 24, alignItems: 'center', backgroundColor: tColors.cardBg, paddingVertical: 32, borderRadius: 24, borderWidth: 1, borderColor: tColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 16, elevation: 5 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: tColors.border },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: tColors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: tColors.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: tColors.cardBg },
    
    name: { fontSize: 22, fontWeight: '800', color: tColors.textDark },
    goal: { fontSize: 14, color: tColors.primary, marginTop: 4, fontWeight: '600' },
    phone: { fontSize: 13, color: tColors.textGray, marginTop: 4 },
    
    sectionTitle: { fontSize: 13, fontWeight: '700', color: tColors.textGray, marginLeft: 24, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    menuCard: { backgroundColor: tColors.cardBg, borderRadius: 20, marginHorizontal: 24, marginBottom: 24, paddingVertical: 8, borderWidth: 1, borderColor: tColors.border },
    
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    menuIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: tColors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: tColors.textDark },
    divider: { height: 1, backgroundColor: tColors.border, marginLeft: 70 },
    
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, paddingVertical: 16, borderRadius: 16, backgroundColor: tColors.dangerLight, borderWidth: 1, borderColor: tColors.danger + '40' },
    logoutText: { fontSize: 16, fontWeight: '700', color: tColors.danger, marginLeft: 8 },
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tColors.bg, padding: 30 }
  });

  if (!studentData) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={tColors.primary} />
        <Text style={{ marginTop: 12, color: tColors.textGray, fontWeight: '600', textAlign: 'center' }}>
          Loading Profile...
        </Text>
        <Text style={{ marginTop: 8, color: tColors.textGray, fontSize: 12, textAlign: 'center' }}>
          Agar load nahi ho raha, toh "Reset" dabakar dobara koshish karein.
        </Text>
        
        <TouchableOpacity 
          style={{ marginTop: 24, backgroundColor: tColors.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 }} 
          onPress={() => fetchStudentBookings()}
        >
          <Text style={{ color: '#FFF', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ marginTop: 16 }} 
          onPress={() => logout(router)}
        >
          <Text style={{ color: tColors.textGray, fontWeight: '600', textDecorationLine: 'underline' }}>Reset & Login Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.heading}>Profile</Text>
      </View>

      <View style={s.profileCard}>
        <View style={s.avatarContainer}>
          {studentData?.photo ? (
            <Image source={{ uri: studentData.photo }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={tColors.primary} />
            </View>
          )}
          <TouchableOpacity style={s.editBadge} activeOpacity={0.8} onPress={() => router.push('/student/edit-profile')}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={s.name}>{studentData?.name || 'Student'}</Text>
        {studentData?.studyGoal ? <Text style={s.goal}>{studentData.studyGoal}</Text> : null}
        {studentData?.phone ? <Text style={s.phone}>+91 {studentData.phone}</Text> : null}
      </View>

      <Text style={s.sectionTitle}>General</Text>
      <View style={s.menuCard}>
        <TouchableOpacity style={s.menuItem} activeOpacity={0.7} onPress={() => router.push('/student/edit-profile')}>
          <View style={s.menuIconBox}><Ionicons name="person-outline" size={18} color={tColors.primary} /></View>
          <Text style={s.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color={tColors.textGray} />
        </TouchableOpacity>
        <View style={s.divider} />
        
        <TouchableOpacity style={s.menuItem} activeOpacity={0.7} onPress={() => router.push('/student/notifications')}>
          <View style={s.menuIconBox}><Ionicons name="notifications-outline" size={18} color={tColors.primary} /></View>
          <Text style={s.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={tColors.textGray} />
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Preferences</Text>
      <View style={s.menuCard}>
        <View style={s.menuItem}>
          <View style={[s.menuIconBox, { backgroundColor: isDarkMode ? '#333' : '#F3F4F6' }]}>
            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={18} color={isDarkMode ? "#FFF" : "#F5A623"} />
          </View>
          <Text style={s.menuText}>Dark Mode</Text>
          <Switch 
            value={isDarkMode} 
            onValueChange={setIsDarkMode} 
            trackColor={{ false: tColors.border, true: tColors.primary }}
            thumbColor={'#FFF'}
          />
        </View>
        <View style={s.divider} />
        
        <TouchableOpacity style={s.menuItem} activeOpacity={0.7} onPress={() => router.push('/student/help-support')}>
          <View style={s.menuIconBox}><Ionicons name="help-buoy-outline" size={18} color={tColors.primary} /></View>
          <Text style={s.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color={tColors.textGray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        testID="logout-btn" 
        style={s.logoutBtn} 
        onPress={() => {
          const msg = 'Are you sure you want to logout?';
          if (Platform.OS === 'web') {
            if (window.confirm(msg)) {
              logout(router);
            }
          } else {
            Alert.alert(
              'Logout',
              msg,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => logout(router) }
              ]
            );
          }
        }} 
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color={tColors.danger} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
