import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../src/context/AppContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../../src/services/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudentEditProfile() {
  const router = useRouter();
  const { studentData, setStudentData, theme: tColors } = useApp();
  
  const [name, setName] = useState(studentData?.name || '');
  const [city, setCity] = useState(studentData?.city || 'Jaipur');
  const [studyGoal, setStudyGoal] = useState(studentData?.studyGoal || '');
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
      
      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` } // DO NOT manually set Content-Type!
      });
      
      const data = await response.json();
      if (data?.success) return data.url;
      return null;
    } catch (error) {
      console.error('Photo upload failed:', error.message);
      return null;
    }
  };

  const handleSave = async () => {
    // Name Validation (Letters only)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!name.trim()) return Alert.alert('Error', 'Please enter your name');
    if (!nameRegex.test(name.trim())) return Alert.alert('Error', 'Name must contain letters only');
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      let uploadedPhotoUrl = photo;
      // If photo exists and is not a remote URL (i.e. it's newly picked), upload it first
      if (photo && !photo.startsWith('http')) {
        uploadedPhotoUrl = await uploadPhoto(photo, token);
      }

      const payload = {
        name: name.trim(),
        city: city.trim(),
        studyGoal: studyGoal.trim(),
      };
      if (uploadedPhotoUrl) payload.photo = uploadedPhotoUrl;

      const res = await axios.put(API_ENDPOINTS.USERS + '/profile', payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data?.success) {
        setStudentData(res.data.user);
        Alert.alert('Success', 'Profile updated successfully');
        router.back();
      }
    } catch (error) {
      console.log("[ProfileSave Error]", error.response?.data || error.message);
      Alert.alert('Save Failed', error.response?.data?.message || error.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: tColors.cardBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: tColors.border },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: tColors.textDark, textAlign: 'center', marginRight: 40 },
    
    scroll: { paddingHorizontal: 24 },
    avatarSection: { alignItems: 'center', marginVertical: 32 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: tColors.primaryLight },
    changePhoto: { marginTop: 12, fontSize: 14, fontWeight: '600', color: tColors.primary },
    
    label: { fontSize: 14, fontWeight: '700', color: tColors.textDark, marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: tColors.cardBg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: tColors.textDark, borderWidth: 1, borderColor: tColors.border, marginBottom: 20 },
    
    saveBtn: { backgroundColor: tColors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 10, elevation: 2 },
    saveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={tColors.textDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={s.avatar}>
            {photo ? (
              <Image source={{ uri: photo }} style={{ width: 100, height: 100, borderRadius: 50 }} />
            ) : (
              <Ionicons name="person" size={50} color={tColors.primary} style={{ alignSelf: 'center', marginTop: 25 }} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text style={s.changePhoto}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Full Name</Text>
        <TextInput 
          style={s.input} 
          placeholder="Enter your name" 
          value={name} 
          onChangeText={setName} 
        />

        <Text style={s.label}>City</Text>
        <TextInput 
          style={s.input} 
          placeholder="Enter your city" 
          value={city} 
          onChangeText={setCity} 
        />

        <Text style={s.label}>Study Goal (Optional)</Text>
        <TextInput 
          style={s.input} 
          placeholder="e.g. UPSC, JEE, CA" 
          value={studyGoal} 
          onChangeText={setStudyGoal} 
        />

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
