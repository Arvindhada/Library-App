import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loginWithPhone } from '../../src/services/authService';

const theme = {
  bg: '#FDFDFD',
  cardBg: '#FFFFFF',
  cardBorder: '#EAEAEA',
  primaryOr: '#1D7151',
  textWh: '#FFFFFF',
  textMu: '#707375',
  textDark: '#1A1D1E',
  inputBg: '#F3F4F6',
};

export default function OwnerLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (phone.length !== 10) { 
      Alert.alert('Error', 'Enter valid 10-digit number'); 
      return; 
    }
    
    setLoading(true);
    try {
      // TEMPORARY: Bypassing actual backend call for UI testing on physical phone
      // await loginWithPhone(phone);
      
      setTimeout(() => {
        setLoading(false);
        router.push({ pathname: '/owner/otp', params: { phone } });
      }, 1000);
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Login Error', error.message || 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.back}>
            <Ionicons name="arrow-back" size={24} color={theme.textDark} />
          </TouchableOpacity>

          <View style={s.logoBox}>
            <Ionicons name="business" size={30} color="#fff" />
          </View>

          <Text style={s.heading}>Owner Login</Text>
          <Text style={s.sub}>Apni library manage karo easily</Text>

          <View style={s.inputContainer}>
            <Text style={s.label}>Phone Number</Text>
            <View style={s.phoneRow}>
              <Text style={s.prefix}>+91</Text>
              <TextInput 
                testID="phone-input" 
                style={s.input} 
                placeholder="9876543210" 
                placeholderTextColor="#A0A0A0"
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad" 
                maxLength={10} 
              />
            </View>
          </View>

          <TouchableOpacity testID="send-otp-btn" style={[s.btn, loading && { opacity: 0.6 }]} onPress={sendOtp} disabled={loading}>
            <Text style={s.btnText}>{loading ? 'Sending...' : 'Login Karo'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.googleBtn}>
            <Ionicons name="logo-google" size={16} color={theme.textDark} style={{ marginRight: 8 }} />
            <Text style={s.googleText}>Google se Login karo</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 40, alignItems: 'center' },
  back: { alignSelf: 'flex-start', padding: 4, marginBottom: 20 },
  
  logoBox: { width: 64, height: 64, backgroundColor: theme.primaryOr, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  
  heading: { fontSize: 26, fontWeight: '800', color: theme.textDark, letterSpacing: -0.4, marginBottom: 8 },
  sub: { fontSize: 14, color: theme.textMu, textAlign: 'center', marginBottom: 32 },
  
  inputContainer: { width: '100%', marginBottom: 24 },
  label: { fontSize: 13, color: theme.textDark, fontWeight: '600', marginBottom: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 16, paddingHorizontal: 16 },
  prefix: { fontSize: 16, color: theme.textDark, fontWeight: '600', marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: theme.textDark, fontWeight: '500' },
  
  btn: { width: '100%', backgroundColor: theme.primaryOr, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16, shadowColor: theme.primaryOr, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnText: { color: theme.textWh, fontSize: 16, fontWeight: '700' },
  
  googleBtn: { width: '100%', flexDirection: 'row', backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  googleText: { fontSize: 15, color: theme.textDark, fontWeight: '600' }
});
