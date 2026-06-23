import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Image, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { uploadToCloudinary } from '../../src/services/cloudinaryService';

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

export default function StudentOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { registerStudentDirect } = useApp();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter your name'); return; }
    if (phone.trim().length !== 10) { Alert.alert('Error', 'Please enter a valid 10-digit mobile number'); return; }
    
    setLoading(true);
    try {
      let photoUrl = null;
      if (photo) {
        photoUrl = await uploadToCloudinary(photo, 'students');
      }
      const success = await registerStudentDirect({
        name: name.trim(),
        phone: phone.trim(),
        studyGoal: goal.trim(),
        photo: photoUrl,
      });
      if (success) {
        router.replace('/student/tabs');
      } else {
        Alert.alert('Registration Failed', 'Could not sync with the database.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
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
              <Ionicons name="school" size={24} color={C.white} />
            </View>
            <View style={s.headerTextBox}>
              <Text style={s.headerTitle}>Student Profile</Text>
              <Text style={s.headerSub}>Create your study profile</Text>
            </View>
          </View>

          {/* ── PHOTO PICKER ── */}
          <View style={s.photoSection}>
            <TouchableOpacity testID="photo-picker" style={{ alignItems: 'center' }} onPress={pickImage} activeOpacity={0.8}>
              <View style={s.photoWrap}>
                {photo ? (
                  <Image source={{ uri: photo }} style={s.photoImg} />
                ) : (
                  <View style={s.photoPlaceholder}>
                    <Ionicons name="camera" size={32} color={C.textGray} />
                  </View>
                )}
              </View>
              <Text style={s.photoLabel}>Add Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {/* ── INPUT FIELDS ── */}
          <View style={s.formBox}>
            <View style={s.inputWrapper}>
              <Text style={s.label}>Full Name</Text>
              <TextInput 
                testID="name-input"
                style={s.input} 
                placeholder="Enter your name" 
                placeholderTextColor={C.textGray}
                value={name} 
                onChangeText={setName} 
              />
            </View>

            <View style={s.inputWrapper}>
              <Text style={s.label}>What are you preparing for?</Text>
              <TextInput 
                testID="goal-input"
                style={s.input} 
                placeholder="e.g. UPSC, NEET, JEE, College Exams" 
                placeholderTextColor={C.textGray}
                value={goal} 
                onChangeText={setGoal} 
              />
            </View>

            <View style={s.inputWrapper}>
              <Text style={s.label}>Mobile Number</Text>
              <View style={s.phoneInputContainer}>
                <Text style={s.prefix}>+91</Text>
                <View style={s.verticalDivider} />
                <TextInput 
                  testID="phone-input"
                  style={s.phoneInput} 
                  placeholder="98765 43210" 
                  placeholderTextColor={C.textGray}
                  value={phone} 
                  onChangeText={setPhone} 
                  keyboardType="phone-pad" 
                  maxLength={10} 
                />
              </View>
            </View>
          </View>

          {/* ── BUTTON ── */}
          <TouchableOpacity 
            testID="lets-go-btn" 
            style={[s.btn, loading && { opacity: 0.8 }]} 
            onPress={handleSubmit} 
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={s.btnContent}>
                <Text style={s.btnText}>{"Let's Go!"}</Text>
                <Ionicons name="arrow-forward" size={20} color={C.white} style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  logoWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  headerTextBox: { marginLeft: 12 },
  headerTitle: { color: C.textDark, fontSize: 18, fontWeight: '700' },
  headerSub: { color: C.textGray, fontSize: 13 },

  photoSection: { alignItems: 'center', marginVertical: 20 },
  photoWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: C.primary, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  photoImg: { width: 100, height: 100 },
  photoPlaceholder: { width: 100, height: 100, backgroundColor: '#EAE8E3', justifyContent: 'center', alignItems: 'center' },
  photoLabel: { color: C.primary, fontSize: 13, fontWeight: '600', marginTop: 10 },

  formBox: { backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 1, marginBottom: 28 },
  inputWrapper: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 },
  input: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.textDark },

  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 14 },
  prefix: { fontSize: 15, fontWeight: '600', color: C.textDark },
  verticalDivider: { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 12 },
  phoneInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.textDark },

  btn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#0F6E56', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: C.white, fontSize: 16, fontWeight: '700' },
});
