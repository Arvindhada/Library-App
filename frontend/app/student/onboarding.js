import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../../src/services/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudentOnboarding() {
  const router = useRouter();
  const { studentData, setStudentData, setUserRole } = useApp();
  const [name, setName] = useState(studentData?.name || '');
  const [goal, setGoal] = useState(studentData?.studyGoal || '');
  const [photo, setPhoto] = useState(studentData?.photo || null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const uploadPhoto = async (photoUri, token) => {
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const res = await fetch(photoUri);
        const blob = await res.blob();
        formData.append('image', blob, 'profile.jpg');
      } else {
        const filename = photoUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('image', { uri: photoUri, name: filename, type });
      }
      
      const uploadRes = await axios.post(API_ENDPOINTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (uploadRes.data?.success) {
        return uploadRes.data.url;
      }
      return null;
    } catch (error) {
      console.error('Photo upload failed:', error.response?.data || error.message);
      return null;
    }
  };

  const handleSubmit = async () => {
    // 1. Name Validation (Letters only)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!nameRegex.test(name.trim())) {
      Alert.alert('Error', 'Name must contain letters only');
      return;
    }

    // 2. Study Goal Validation
    if (!goal.trim()) {
      Alert.alert('Error', 'Please specify what you are studying');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Session expired. Please login again.');
        router.replace('/student/login');
        return;
      }

      // Upload photo if selected
      let uploadedPhotoUrl = null;
      if (photo && !photo.startsWith('http')) {
        uploadedPhotoUrl = await uploadPhoto(photo, token);
      }

      // Update Profile with Name, Study Goal, and Photo
      const profilePayload = {
        name: name.trim(),
        studyGoal: goal.trim(),
      };
      if (uploadedPhotoUrl) {
        profilePayload.photo = uploadedPhotoUrl;
      } else if (photo && photo.startsWith('http')) {
        profilePayload.photo = photo;
      }

      const profileRes = await axios.put(API_ENDPOINTS.USERS + '/profile', profilePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileRes.data?.success) {
        setStudentData(profileRes.data.user);
        router.replace('/student/tabs');
      }
    } catch (error) {
      console.error('Onboarding failed:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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



        <TouchableOpacity testID="lets-go-btn" style={s.btn} onPress={handleSubmit} activeOpacity={0.8} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Let&apos;s Go!</Text>}
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
