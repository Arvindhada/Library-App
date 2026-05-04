import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyOTP } from '../../src/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const theme = {
  bg: '#FDFDFD',
  cardBg: '#FFFFFF',
  cardBorder: '#EAEAEA',
  primaryOr: '#1D7151',
  textWh: '#FFFFFF',
  textMu: '#707375',
  textDark: '#1A1D1E',
  inputBg: '#FDFDFD',
  inputBorder: '#1D7151'
};

export default function OwnerOTP() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '']);
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
    if (text && idx < 3) refs.current[idx + 1]?.focus();
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < 4) { Alert.alert('Error', 'Enter complete 4-digit OTP'); return; }
    
    setLoading(true);
    try {
      // TEMPORARY: Bypassing actual backend call for UI testing
      // const data = await verifyOTP(phone, code);
      
      setTimeout(async () => {
        // Save Token and Role
        await AsyncStorage.setItem('userToken', 'dummy-token');
        await AsyncStorage.setItem('userRole', 'owner');
        
        setLoading(false);
        router.replace('/owner/tabs');
      }, 1000);
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Verification Failed', error.message || 'Invalid OTP. Try 1234.');
    }
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={theme.textDark} />
        </TouchableOpacity>

        <View style={s.logoBox}>
          <Ionicons name="shield-checkmark" size={30} color="#fff" />
        </View>

        <Text style={s.heading}>OTP Verification</Text>
        <Text style={s.sub}>Sent to +91 {phone || 'XXXXXXXXXX'}</Text>

        <View style={s.inputContainer}>
          <Text style={s.label}>Enter OTP (4 digits)</Text>
          <View style={s.otpRow}>
            {otp.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => (refs.current[i] = r)}
                style={[s.otpBox, d ? s.otpFilled : null]}
                value={d}
                onChangeText={(t) => handleChange(t, i)}
                keyboardType="number-pad"
                maxLength={1}
                testID={`otp-${i}`}
              />
            ))}
          </View>
        </View>

        <Text style={s.resendText}>
          OTP nahi aaya?{' '}
          {timer > 0 ? (
            <Text style={{ color: theme.textMu }}>Wait {timer}s</Text>
          ) : (
            <Text style={{ color: theme.primaryOr }} onPress={() => { setTimer(30); Alert.alert('OTP Resent'); }}>Resend</Text>
          )}
        </Text>

        <TouchableOpacity testID="verify-btn" style={[s.btn, loading && { opacity: 0.7 }]} onPress={verify} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Verifying...' : 'Verify Karo'}</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 40, alignItems: 'center' },
  back: { alignSelf: 'flex-start', padding: 4, marginBottom: 20 },
  
  logoBox: { width: 64, height: 64, backgroundColor: theme.primaryOr, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  
  heading: { fontSize: 26, fontWeight: '800', color: theme.textDark, letterSpacing: -0.4, marginBottom: 8 },
  sub: { fontSize: 14, color: theme.textMu, textAlign: 'center', marginBottom: 32 },
  
  inputContainer: { width: '100%', marginBottom: 12 },
  label: { fontSize: 13, color: theme.textDark, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 8 },
  otpBox: { width: 56, height: 64, borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder, textAlign: 'center', fontSize: 24, fontWeight: '700', color: theme.textDark, backgroundColor: theme.cardBg },
  otpFilled: { borderColor: theme.primaryOr, backgroundColor: theme.inputBg },
  
  resendText: { fontSize: 13, color: theme.textMu, marginBottom: 32, fontWeight: '500' },
  
  btn: { width: '100%', backgroundColor: theme.primaryOr, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16, shadowColor: theme.primaryOr, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnText: { color: theme.textWh, fontSize: 16, fontWeight: '700' }
});
