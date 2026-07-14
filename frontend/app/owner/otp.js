import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_ENDPOINTS } from '../../src/services/apiConfig';
import { useApp } from '../../src/context/AppContext';

// ── Colors (Stitch Design Identity) ──
const C = {
  bg: '#F5F3EE',          // Sand background
  surface: '#FFFFFF',     // Card surfaces
  primary: '#0F6E56',     // Dark green / teal
  primaryLight: '#E8F5F0',// Light green
  primaryBorder: '#9FE1CB',
  textDark: '#1A1C1B',    // Dark typography
  textGray: '#6F7A74',    // Muted grey typography
  border: '#D1CFCA',      // Border grey
  white: '#FFFFFF',
};

export default function OwnerOTP() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams();
  const { fetchDashboardData, setUserRole } = useApp();
  const [otp, setOtp] = useState(['', '', '', '']); // 4-digit OTP input state
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    const t = setInterval(() => setTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (text, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = text;
    setOtp(newOtp);

    // Auto-focus next box
    if (text && idx < 3) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
      const newOtp = [...otp];
      newOtp[idx - 1] = '';
      setOtp(newOtp);
    }
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < 4) { 
      Alert.alert('Invalid OTP', 'Please enter a complete 4-digit OTP.'); 
      return; 
    }
    
    setLoading(true);
    try {
      // Hit real backend verify-otp route
      const response = await axios.post(API_ENDPOINTS.VERIFY_OTP, {
        phone: phone.includes('+91') ? phone : `+91${phone}`,
        otp: code,
        role: 'owner',
      }, { timeout: 10000 });
      
      const { token, role } = response.data;

      if (!token) {
        throw new Error('No token received from server');
      }

      // ✅ Save token to SecureStore (same place useAuth reads from)
      await SecureStore.setItemAsync('userToken', token);
      await AsyncStorage.setItem('userRole', role || 'owner');

      // Update context role
      setUserRole(role || 'owner');

      // ✅ Immediately load library + dashboard data before navigating
      await fetchDashboardData();
      
      setLoading(false);
      router.replace('/owner/tabs');
    } catch (e) {
      setLoading(false);
      const msg = e.response?.data?.message || e.message || 'OTP verification failed.';
      Alert.alert(
        'Verification Failed ❌',
        `${msg}\n\n💡 Testing ke liye OTP: 1234`
      );
    }
  };


  return (
    <SafeAreaView style={[s.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={s.content} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          {/* ── HEADER ── */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={C.primary} />
            </TouchableOpacity>
            <View style={s.logoWrap}>
              <Ionicons name="chatbubble-ellipses" size={24} color={C.white} />
            </View>
            <View style={s.headerTextBox}>
              <Text style={s.headerTitle}>Verify OTP</Text>
              <Text style={s.headerSub}>Sent to +91 {phone || '98765 43210'}</Text>
            </View>
          </View>

          {/* ── BODY HEADING ── */}
          <View style={s.bodyHeader}>
            <Text style={s.headingText}>Enter 4-digit OTP</Text>
            <Text style={s.subText}>Enter the verification code sent to your device</Text>
          </View>

          {/* ── OTP INPUT GRID ── */}
          <View style={s.otpRow}>
            {otp.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => (refs.current[i] = r)}
                style={[s.otpBox, d ? s.otpFilled : null]}
                value={d}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                testID={`otp-${i}`}
              />
            ))}
          </View>

          {/* ── RESEND TEXT ── */}
          <View style={s.resendContainer}>
            <Text style={s.resendText}>{"Didn't receive OTP? "}</Text>
            {timer > 0 ? (
              <Text style={s.timerText}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={() => { setTimer(30); Alert.alert('OTP Resent', 'A new code has been sent.'); }}>
                <Text style={s.resendLink}>Resend code</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── VERIFY BUTTON ── */}
          <TouchableOpacity 
            testID="verify-btn"
            style={[s.primaryBtn, loading && { opacity: 0.7 }]} 
            onPress={verify} 
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>{loading ? 'Verifying...' : 'Verify & Proceed'}</Text>
          </TouchableOpacity>

          {/* ── BOTTOM BANNER CARD ── */}
          <View style={s.bannerCard}>
            <Ionicons name="shield-outline" size={22} color={C.primary} style={s.bannerIcon} />
            <Text style={s.bannerText}>
              Your data is safe and secure • Used only for library management
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20 },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 16,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextBox: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textDark,
  },
  headerSub: {
    fontSize: 12.5,
    color: C.textGray,
    fontWeight: '500',
  },

  // Body Heading
  bodyHeader: {
    marginBottom: 32,
  },
  headingText: {
    fontSize: 28,
    fontWeight: '800',
    color: C.textDark,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    color: C.textGray,
    lineHeight: 22,
    fontWeight: '500',
  },

  // OTP Row
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
    gap: 16,
  },
  otpBox: {
    width: 58,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: C.textDark,
    backgroundColor: C.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  otpFilled: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },

  // Resend Container
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  resendText: {
    fontSize: 14,
    color: C.textGray,
    fontWeight: '500',
  },
  timerText: {
    fontSize: 14,
    color: C.textGray,
    fontWeight: '700',
  },
  resendLink: {
    fontSize: 14,
    color: C.primary,
    fontWeight: '700',
  },

  // Primary Button
  primaryBtn: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  btnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Bottom Banner Card
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryLight,
    borderColor: C.primaryBorder,
    borderWidth: 0.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    gap: 12,
  },
  bannerIcon: {
    marginRight: 2,
  },
  bannerText: {
    flex: 1,
    fontSize: 12.5,
    color: C.primary,
    fontWeight: '600',
    lineHeight: 18,
  },
});
