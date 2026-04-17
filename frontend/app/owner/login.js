import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';

export default function OwnerLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = () => {
    if (phone.length !== 10) { Alert.alert('Error', 'Enter valid 10-digit number'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); router.push({ pathname: '/owner/otp', params: { phone } }); }, 800);
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={s.heading}>Welcome, Owner!</Text>
        <Text style={s.sub}>Login to manage your library</Text>

        <Text style={s.label}>Phone Number</Text>
        <View style={s.phoneRow}>
          <Text style={s.prefix}>+91</Text>
          <TextInput testID="phone-input" style={s.input} placeholder="9876543210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
        </View>

        <TouchableOpacity testID="send-otp-btn" style={[s.btn, loading && { opacity: 0.6 }]} onPress={sendOtp} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
        </TouchableOpacity>

        <View style={s.divider}><View style={s.line} /><Text style={s.or}>OR</Text><View style={s.line} /></View>

        <TouchableOpacity style={s.googleBtn}>
          <Ionicons name="logo-google" size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
          <Text style={s.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.registerLink}>
          <Text style={s.registerText}>New owner? <Text style={{ color: colors.primary, fontWeight: '600' }}>Register here</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, padding: 24, paddingTop: 56 },
  back: { marginBottom: 24, padding: 4, alignSelf: 'flex-start' },
  heading: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 6 },
  sub: { fontSize: 15, color: colors.textSecondary, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.bgLight, marginBottom: 20 },
  prefix: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.textPrimary },
  btn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginBottom: 24 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  or: { marginHorizontal: 12, color: colors.textSecondary, fontSize: 13 },
  googleBtn: { flexDirection: 'row', borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  googleText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  registerLink: { alignItems: 'center' },
  registerText: { fontSize: 14, color: colors.textSecondary },
});
