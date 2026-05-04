import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';

export default function SplashScreen() {
  const router = useRouter();
  const {setUserRole}  = useApp();

  const handleOwner = () => {
    setUserRole('owner');
    router.push('/owner/login');
  };
  const handleStudent = () => {
    setUserRole('student');
    router.push('/student/onboarding');
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Logo */}
      <View style={s.logoWrap}>
        <View style={s.logoCircle}>
          <Ionicons name="book" size={48} color={colors.white} />
        </View>
        <Text style={s.appName}>LibConnect</Text>
        <Text style={s.tagline}>Connect with your perfect study space</Text>
      </View>

      {/* Buttons */}
      <View style={s.btnWrap}>
        <TouchableOpacity testID="owner-btn" style={s.ownerBtn} onPress={handleOwner} activeOpacity={0.8}>
          <Ionicons name="business-outline" size={22} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={s.ownerBtnText}>Owner</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="student-btn" style={s.studentBtn} onPress={handleStudent} activeOpacity={0.8}>
          <Ionicons name="school-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={s.studentBtnText}>Student</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 80 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  appName: { fontSize: 36, fontWeight: 'bold', color: colors.textPrimary },
  tagline: { fontSize: 15, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  btnWrap: { width: '100%' },
  ownerBtn: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ownerBtnText: { color: colors.white, fontSize: 18, fontWeight: '600' },
  studentBtn: { flexDirection: 'row', backgroundColor: colors.white, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary },
  studentBtnText: { color: colors.primary, fontSize: 18, fontWeight: '600' },
});
