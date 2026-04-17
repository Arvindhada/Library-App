import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';

export default function StudentOnboarding() {
  const router = useRouter();
  const { setStudentData } = useApp();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleSubmit = () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter your name'); return; }
    setStudentData({ name: name.trim(), studyGoal: goal.trim(), phone, photo });
    router.replace('/student/tabs');
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>

        {/* Photo picker */}
        <TouchableOpacity testID="photo-picker" style={s.photoWrap} onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo }} style={s.photoImg} />
          ) : (
            <View style={s.photoPlaceholder}><Ionicons name="person" size={48} color={colors.textLight} /></View>
          )}
          <Text style={s.photoText}>Choose Photo</Text>
        </TouchableOpacity>

        {/* Form */}
        <Text style={s.label}>Your Name</Text>
        <TextInput testID="name-input" style={s.input} placeholder="Enter your name" value={name} onChangeText={setName} />

        <Text style={s.label}>What are you studying?</Text>
        <TextInput testID="goal-input" style={s.input} placeholder="e.g. UPSC, NEET, B.Tech, CA..." value={goal} onChangeText={setGoal} />

        <Text style={s.label}>Mobile Number</Text>
        <View style={s.phoneRow}>
          <Text style={s.prefix}>+91</Text>
          <TextInput testID="phone-input" style={s.phoneInput} placeholder="9876543210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
        </View>

        <TouchableOpacity testID="lets-go-btn" style={s.btn} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={s.btnText}>Let's Go!</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, padding: 24, paddingTop: 52 },
  back: { marginBottom: 16, padding: 4, alignSelf: 'flex-start' },
  photoWrap: { alignItems: 'center', marginBottom: 28 },
  photoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.bgLight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.cardBorder },
  photoImg: { width: 120, height: 120, borderRadius: 60 },
  photoText: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.bgLight, marginBottom: 18 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.bgLight, marginBottom: 28 },
  prefix: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginRight: 8 },
  phoneInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.textPrimary },
  btn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
});
