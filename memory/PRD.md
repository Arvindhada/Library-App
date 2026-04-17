# LibConnect - PRD

## Overview
LibConnect is a pan-India library discovery and seat booking mobile application built with React Native + Expo. It connects library owners with students seeking study spaces.

## Key Features
- **Splash Screen**: Role selection (Owner/Student)
- **Owner Flow**: Login → OTP → Dashboard with stats, revenue, seat grid, library management
- **Student Flow**: Onboarding → Home (library listing) → Search → Library Detail → Saved → Profile
- **WhatsApp Integration**: Real deep linking for contacting library owners
- **Seat Grid Manager**: Visual 80-seat grid with toggle booked/available
- **Photo Upload**: Student profile photo via expo-image-picker
- **Location**: Distance-based library sorting (structure ready)

## Tech Stack
- React Native + Expo SDK 54
- Expo Router (file-based routing)
- StyleSheet.create() for styling
- AsyncStorage for local state
- expo-linking for WhatsApp
- expo-image-picker for photos
- expo-location (structure ready)

## Screens (15 total)
### Auth
1. Splash Screen (/)
2. Owner Login (/owner/login)
3. Owner OTP (/owner/otp)
4. Student Onboarding (/student/onboarding)

### Owner (4 tab screens + 2 push screens)
5. Owner Home (/owner/tabs/home)
6. Owner Dashboard (/owner/tabs/dashboard) — Seat grid + Timing & Fees
7. Owner Library (/owner/tabs/library)
8. Owner Profile (/owner/tabs/profile)
9. Seat Manager (/owner/seat-manager)
10. Add/Edit Library (/owner/add-library)

### Student (4 tab screens + 1 push screen)
11. Student Home (/student/tabs/home)
12. Student Search (/student/tabs/search)
13. Student Saved (/student/tabs/saved)
14. Student Profile (/student/tabs/profile)
15. Library Detail (/student/library-detail)

## Data
5 dummy libraries with real Jaipur addresses, coordinates, photos, facilities, and half/full time fees.

## Status: MVP Complete
