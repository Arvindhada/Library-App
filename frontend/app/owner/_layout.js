import React from 'react';
import { Stack } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="tabs" />
      <Stack.Screen name="seat-manager" />
      <Stack.Screen name="manage-students" />
      <Stack.Screen name="add-library" />
      <Stack.Screen name="edit-library" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="terms-privacy" />
      <Stack.Screen name="rate-app" />
      <Stack.Screen name="revenue" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="fee-reminders" />
      <Stack.Screen name="student-profile" />
      <Stack.Screen name="about-app" />
      <Stack.Screen name="revenue-reports" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
