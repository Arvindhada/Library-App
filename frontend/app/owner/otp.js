import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';

export default function OwnerOTP() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const refs = useRef([]);

  useEffect(() => {
    const t = setInterval(() => setTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (text, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = text;
    setOtp(newOtp);
    if (text && idx < 5) refs.current[idx + 1]?.focus();
  };

  const verify = () => {
    const code = otp.join('');
    if (code.length < 6) { Alert.alert('Error', 'Enter complete 6-digit OTP'); return; }
    router.replace('/owner/tabs');
  };

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={s.heading}>Enter OTP</Text>
      <Text style={s.sub}>Sent to +91 {phone || 'XXXXXXXXXX'}</Text>

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

      <TouchableOpacity testID="verify-btn" style={s.btn} onPress={verify}>
        <Text style={s.btnText}>Verify OTP</Text>
      </TouchableOpacity>

      <TouchableOpacity disabled={timer > 0} onPress={() => { setTimer(30); Alert.alert('OTP Resent'); }}>
        <Text style={s.resend}>{timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: 24, paddingTop: 56 },
  back: { marginBottom: 24, padding: 4, alignSelf: 'flex-start' },
  heading: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 6 },
  sub: { fontSize: 15, color: colors.textSecondary, marginBottom: 32 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  otpBox: { width: 48, height: 54, borderRadius: 10, borderWidth: 1.5, borderColor: colors.cardBorder, textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.textPrimary, backgroundColor: colors.bgLight },
  otpFilled: { borderColor: colors.primary },
  btn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  resend: { textAlign: 'center', color: colors.primary, fontSize: 14, fontWeight: '500' },
});
