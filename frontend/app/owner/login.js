import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_ENDPOINTS } from '../../src/services/apiConfig';

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

export default function OwnerLogin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (phone.length !== 10) { 
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.'); 
      return; 
    }
    
    setLoading(true);
    try {
      // Hit real backend login/send-otp endpoint
      await axios.post(API_ENDPOINTS.LOGIN, { phone });
      setLoading(false);
      router.push({ pathname: '/owner/otp', params: { phone } });
    } catch (e) {
      setLoading(false);
      Alert.alert(
        'Login Failed',
        e.response?.data?.message || e.message || 'Could not connect to the backend server.'
      );
    }
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
              <Ionicons name="business" size={24} color={C.white} />
            </View>
            <View style={s.headerTextBox}>
              <Text style={s.headerTitle}>Owner Login</Text>
              <Text style={s.headerSub}>Login via OTP</Text>
            </View>
          </View>

          {/* ── BODY HEADING ── */}
          <View style={s.bodyHeader}>
            <Text style={s.headingText}>Enter phone number</Text>
            <Text style={s.subText}>Use your registered mobile number to access your library</Text>
          </View>

          {/* ── PHONE INPUT FIELD ── */}
          <View style={s.inputWrapper}>
            <Text style={s.label}>Phone Number</Text>
            <View style={s.inputContainer}>
              <Text style={s.prefix}>+91</Text>
              <View style={s.verticalDivider} />
              <TextInput
                testID="phone-input"
                style={s.input}
                placeholder="98765 43210"
                placeholderTextColor={C.textGray}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* ── ACTION BUTTONS ── */}
          <TouchableOpacity 
            testID="send-otp-btn"
            style={[s.primaryBtn, loading && { opacity: 0.7 }]} 
            onPress={sendOtp} 
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
          </TouchableOpacity>

          {/* ── OR DIVIDER ── */}
          <View style={s.dividerRow}>
            <View style={s.line} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.line} />
          </View>

          {/* ── GOOGLE BUTTON ── */}
          <TouchableOpacity style={s.googleBtn} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={18} color={C.textDark} style={{ marginRight: 10 }} />
            <Text style={s.googleText}>Sign in with Google</Text>
          </TouchableOpacity>

          {/* ── BOTTOM BANNER CARD ── */}
          <View style={s.bannerCard}>
            <Ionicons name="shield-checkmark-outline" size={22} color={C.primary} style={s.bannerIcon} />
            <Text style={s.bannerText}>
              Secure and private database • Free & easy to get started today
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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

  // Input Box
  inputWrapper: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textDark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    height: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: C.primary,
    marginRight: 12,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: C.border,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: C.textDark,
    fontWeight: '600',
  },

  // Action Buttons
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
    marginBottom: 20,
  },
  btnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 14,
    color: C.textGray,
    fontWeight: '600',
  },

  // Google button
  googleBtn: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  googleText: {
    fontSize: 15,
    color: C.textDark,
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
