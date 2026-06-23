import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, ActivityIndicator, Alert, Share, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../../../src/services/cloudinaryService';

export default function StudentProfile() {
  const router = useRouter();
  const { studentData, isDarkMode, setIsDarkMode, theme: tColors, logout, savedLibraryIds, currentBookings, saveStudentProfile } = useApp();

  // Edit profile states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(studentData?.name || '');
  const [editGoal, setEditGoal] = useState(studentData?.studyGoal || '');
  const [editPhoto, setEditPhoto] = useState(studentData?.photo || null);
  const [loading, setLoading] = useState(false);

  // Check if there is an active booking
  const hasActiveBooking = currentBookings.some(b => b.status === 'Active' || b.status === 'Pending');
  const activeBookingName = currentBookings.find(b => b.status === 'Active' || b.status === 'Pending')?.library?.name || 'None';

  // Handle Photo Picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setEditPhoto(result.assets[0].uri);
    }
  };

  // Handle Save Profile
  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      let photoUrl = editPhoto;
      
      // If photo was changed to a local Uri, upload to Cloudinary
      if (editPhoto && !editPhoto.startsWith('http')) {
        photoUrl = await uploadToCloudinary(editPhoto, 'students');
      }

      await saveStudentProfile({
        name: editName.trim(),
        studyGoal: editGoal.trim(),
        photo: photoUrl,
      });

      setIsEditModalOpen(false);
      Alert.alert('Success 🎉', 'Profile updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Help & Support
  const handleSupport = () => {
    const phone = '919351471243';
    const message = `Hello! I am ${studentData?.name || 'Student'}. I need help with my LibConnect app.`;
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`).catch(() => {
      Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
    });
  };

  // Share App
  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Hey, checkout LibConnect! Finding and booking library spaces is super easy here 📚✨',
      });
    } catch (error) {
      console.warn('Share failed:', error.message);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, backgroundColor: tColors.bg },
    heading: { fontSize: 28, fontWeight: '800', color: tColors.textDark },
    
    profileCard: { marginHorizontal: 24, marginTop: 8, marginBottom: 20, alignItems: 'center', backgroundColor: tColors.cardBg, paddingVertical: 24, borderRadius: 24, borderWidth: 1, borderColor: tColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 16, elevation: 5 },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: tColors.border },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: tColors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    
    name: { fontSize: 22, fontWeight: '800', color: tColors.textDark },
    goal: { fontSize: 14, color: tColors.primary, marginTop: 4, fontWeight: '600' },
    phone: { fontSize: 13, color: tColors.textGray, marginTop: 4, marginBottom: 16 },
    
    editProfileBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: tColors.primaryLight, borderWidth: 1, borderColor: tColors.primary + '30' },
    editProfileBtnText: { color: tColors.primary, fontWeight: '700', fontSize: 14 },

    // Stats Row
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 24, marginBottom: 24 },
    statBox: { flex: 1, backgroundColor: tColors.cardBg, padding: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: tColors.border, marginRight: 8 },
    statBoxLast: { marginRight: 0 },
    statVal: { fontSize: 16, fontWeight: '800', color: tColors.primary },
    statLabel: { fontSize: 11, color: tColors.textGray, marginTop: 4, fontWeight: '600' },
    
    sectionTitle: { fontSize: 13, fontWeight: '700', color: tColors.textGray, marginLeft: 24, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    menuCard: { backgroundColor: tColors.cardBg, borderRadius: 20, marginHorizontal: 24, marginBottom: 24, paddingVertical: 8, borderWidth: 1, borderColor: tColors.border },
    
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    menuIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: tColors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: tColors.textDark },
    divider: { height: 1, backgroundColor: tColors.border, marginLeft: 70 },
    
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, paddingVertical: 16, borderRadius: 16, backgroundColor: tColors.dangerLight, borderWidth: 1, borderColor: tColors.danger + '40' },
    logoutText: { fontSize: 16, fontWeight: '700', color: tColors.danger, marginLeft: 8 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: tColors.cardBg, borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: tColors.border },
    modalTitle: { fontSize: 20, fontWeight: '800', color: tColors.textDark, marginBottom: 20, textAlign: 'center' },
    inputLabel: { fontSize: 12, fontWeight: '700', color: tColors.textGray, marginBottom: 6, textTransform: 'uppercase' },
    textInput: { backgroundColor: tColors.bg, borderWidth: 1, borderColor: tColors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: tColors.textDark, marginBottom: 16 },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: tColors.border, alignItems: 'center' },
    cancelBtnText: { color: tColors.textGray, fontSize: 15, fontWeight: '700' },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: tColors.primary, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  });

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.heading}>Profile</Text>
      </View>

      {/* Main Profile Info Card */}
      <View style={s.profileCard}>
        <View style={s.avatarContainer}>
          {studentData.photo ? (
            <Image source={{ uri: studentData.photo }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={tColors.primary} />
            </View>
          )}
        </View>
        <Text style={s.name}>{studentData.name || 'Student'}</Text>
        {studentData.studyGoal ? <Text style={s.goal}>{studentData.studyGoal}</Text> : null}
        {studentData.phone ? <Text style={s.phone}>+91 {studentData.phone}</Text> : null}
        
        <TouchableOpacity style={s.editProfileBtn} onPress={() => setIsEditModalOpen(true)} activeOpacity={0.8}>
          <Text style={s.editProfileBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>General</Text>
      <View style={s.menuCard}>
        <TouchableOpacity style={s.menuItem} onPress={() => router.push('/student/tabs/saved')} activeOpacity={0.7}>
          <View style={s.menuIconBox}><Ionicons name="bookmark-outline" size={18} color={tColors.primary} /></View>
          <Text style={s.menuText}>Saved Spaces</Text>
          <Ionicons name="chevron-forward" size={18} color={tColors.textGray} />
        </TouchableOpacity>
        <View style={s.divider} />
        
        <TouchableOpacity style={s.menuItem} activeOpacity={0.7}>
          <View style={s.menuIconBox}><Ionicons name="notifications-outline" size={18} color={tColors.primary} /></View>
          <Text style={s.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={tColors.textGray} />
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Preferences & Support</Text>
      <View style={s.menuCard}>
        <View style={s.menuItem}>
          <View style={[s.menuIconBox, { backgroundColor: isDarkMode ? '#333' : '#F3F4F6' }]}>
            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={18} color={isDarkMode ? "#FFF" : "#F5A623"} />
          </View>
          <Text style={s.menuText}>Dark Mode</Text>
          <Switch 
            value={isDarkMode} 
            onValueChange={setIsDarkMode} 
            trackColor={{ false: tColors.border, true: tColors.primary }}
            thumbColor={'#FFF'}
          />
        </View>
        <View style={s.divider} />
        
        <TouchableOpacity style={s.menuItem} onPress={handleSupport} activeOpacity={0.7}>
          <View style={s.menuIconBox}><Ionicons name="help-buoy-outline" size={18} color={tColors.primary} /></View>
          <Text style={s.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color={tColors.textGray} />
        </TouchableOpacity>
        <View style={s.divider} />

        <TouchableOpacity style={s.menuItem} onPress={handleShare} activeOpacity={0.7}>
          <View style={s.menuIconBox}><Ionicons name="share-social-outline" size={18} color={tColors.primary} /></View>
          <Text style={s.menuText}>Share App</Text>
          <Ionicons name="chevron-forward" size={18} color={tColors.textGray} />
        </TouchableOpacity>
        <View style={s.divider} />

        <TouchableOpacity style={s.menuItem} onPress={() => router.push('/privacy-policy')} activeOpacity={0.7}>
          <View style={s.menuIconBox}><Ionicons name="shield-checkmark-outline" size={18} color={tColors.primary} /></View>
          <Text style={s.menuText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={18} color={tColors.textGray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity testID="logout-btn" style={s.logoutBtn} onPress={async () => { await logout(); router.replace('/'); }} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={tColors.danger} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      {/* Edit Profile Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent={true}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Edit Profile</Text>

            {/* Avatar picker in modal */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={pickImage} style={{ position: 'relative' }}>
                {editPhoto ? (
                  <Image source={{ uri: editPhoto }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                ) : (
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: tColors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={36} color={tColors.primary} />
                  </View>
                )}
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: tColors.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: tColors.cardBg }}>
                  <Ionicons name="camera" size={12} color="#FFF" />
                </View>
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>Name</Text>
            <TextInput 
              style={s.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tera Naam"
              placeholderTextColor={tColors.textGray}
            />

            <Text style={s.inputLabel}>Study Goal (Target Exam)</Text>
            <TextInput 
              style={s.textInput}
              value={editGoal}
              onChangeText={setEditGoal}
              placeholder="Jaise: UPSC, NEET, JEE, SSC"
              placeholderTextColor={tColors.textGray}
            />

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setIsEditModalOpen(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={s.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
