import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../../src/services/apiConfig';
import colors from '../../src/constants/colors';

export default function OwnerRegister() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || phone.length !== 10) {
      Alert.alert('Error', 'Please enter your name and valid 10-digit phone');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_ENDPOINTS.LOGIN.replace('/login', '/register-owner')}`, {
        name, email, phone,
      });

      // Save token and navigate
      await AsyncStorage.setItem('userToken', res.data.token);
      await AsyncStorage.setItem('userRole', 'owner');
      router.replace('/owner/tabs');
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={s.heading}>Create Account</Text>
        <Text style={s.sub}>Register as a new Library Owner</Text>

        <Text style={s.label}>Full Name</Text>
        <TextInput style={s.inputBox} placeholder="John Doe" value={name} onChangeText={setName} />

        <Text style={s.label}>Email Address</Text>
        <TextInput style={s.inputBox} placeholder="john@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={s.label}>Phone Number</Text>
        <View style={s.phoneRow}>
          <Text style={s.prefix}>+91</Text>
          <TextInput style={s.input} placeholder="Enter your number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
        </View>

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Registering...' : 'Register Now'}</Text>
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
  inputBox: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, backgroundColor: colors.bgLight, marginBottom: 20, color: colors.textPrimary },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.bgLight, marginBottom: 32 },
  prefix: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.textPrimary },
  btn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
