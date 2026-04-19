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
    </Stack>
  );
}
