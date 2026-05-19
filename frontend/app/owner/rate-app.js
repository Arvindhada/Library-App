import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';

export default function RateApp() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRating = (stars) => {
    setRating(stars);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      if (Platform.OS === 'web') window.alert('Please select a star rating first.');
      else Alert.alert('Oops!', 'Please select a star rating first.');
      return;
    }
    
    setSubmitting(true);
    // Simulate API call to save review
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  const getFeedbackMessage = () => {
    if (rating === 5) return 'Awesome! We love you too! ❤️';
    if (rating === 4) return 'Great! We are glad you like it! 😊';
    if (rating === 3) return 'Thanks! We are always improving! 👍';
    if (rating > 0) return 'Thank you for your feedback! We will work harder! 💪';
    return 'How was your experience?';
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="close" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        {!submitted ? (
          <>
            <View style={s.iconWrapper}>
              <Ionicons name="star" size={50} color="#F59E0B" />
            </View>
            
            <Text style={s.title}>Rate your experience</Text>
            <Text style={s.subtitle}>Are you enjoying LibraryWala? Please leave a rating and help us improve.</Text>

            {/* Stars Row */}
            <View style={s.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => handleRating(star)}
                  activeOpacity={0.7}
                  style={s.starBtn}
                >
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={40} 
                    color={star <= rating ? "#F59E0B" : "#D1D5DB"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.feedbackMsg}>{getFeedbackMessage()}</Text>

            <View style={s.inputContainer}>
              <Text style={s.inputLabel}>Write a review (Optional)</Text>
              <TextInput
                style={s.textInput}
                placeholder="Tell us what you love or what we can do better..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                value={feedback}
                onChangeText={setFeedback}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[s.submitBtn, rating === 0 && s.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={rating === 0 || submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.successContainer}>
            <View style={s.successIconWrap}>
              <Ionicons name="heart" size={60} color="#EF4444" />
            </View>
            <Text style={s.successTitle}>Thank You!</Text>
            <Text style={s.successSub}>Your feedback means the world to us. It helps us make LibraryWala better for everyone.</Text>
            <TouchableOpacity 
              style={s.doneBtn} 
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={s.doneBtnText}>Back to Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 10, alignItems: 'flex-end' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 20 },
  
  iconWrapper: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10, marginBottom: 30 },
  
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  starBtn: { padding: 4 },
  feedbackMsg: { fontSize: 15, fontWeight: '600', color: colors.primary, marginBottom: 30, textAlign: 'center', height: 20 },
  
  inputContainer: { width: '100%', marginBottom: 30 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  textInput: { width: '100%', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, fontSize: 15, color: '#1A1A2E', minHeight: 120 },
  
  submitBtn: { width: '100%', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  submitBtnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  successContainer: { flex: 1, alignItems: 'center', paddingTop: 60 },
  successIconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  successSub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, marginBottom: 40 },
  doneBtn: { width: '100%', backgroundColor: '#1A1A2E', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
