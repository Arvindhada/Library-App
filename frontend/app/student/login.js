import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../../src/services/apiConfig';

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

export default function StudentLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadPhone = async () => {
      const savedPhone = await AsyncStorage.getItem('lastStudentPhone');
      if (savedPhone) setPhone(savedPhone);
    };
    loadPhone();
  }, []);

  const sendOtp = async () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone.trim()) { Alert.alert('Error', 'Mobile number is required'); return; }
    if (!phoneRegex.test(phone.trim())) { Alert.alert('Error', 'Enter valid 10-digit number'); return; }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const formattedPhone = `+91${phone.trim()}`;
      const res = await axios.post(API_ENDPOINTS.LOGIN, { phone: formattedPhone });
      if (res.data?.success) {
        await AsyncStorage.setItem('lastStudentPhone', phone);
        setLoading(false);
        router.push({ pathname: '/student/otp', params: { phone } });
      }
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || error.message || 'Network Error or Server Down';
      setErrorMsg(msg);
      Alert.alert('Login Error', msg);
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
            <Ionicons name="school" size={30} color="#fff" />
          </View>

          <Text style={s.heading}>Student Login</Text>
          <Text style={s.sub}>Apni study space access karo</Text>

          <View style={s.inputContainer}>
            <Text style={s.label}>Phone Number</Text>
            <View style={s.phoneRow}>
              <Text style={s.prefix}>+91</Text>
              <TextInput 
                testID="phone-input" 
                style={s.input} 
                placeholder="Enter your number" 
                placeholderTextColor="#94A3B8"
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

          {errorMsg ? <Text style={{ color: 'red', marginBottom: 16, textAlign: 'center' }}>{errorMsg}</Text> : null}

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
});
