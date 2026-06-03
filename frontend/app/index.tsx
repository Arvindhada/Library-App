import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../src/context/AppContext';

// ── Colors (LibConnect Premium Brand Archetype) ──
const C = {
  bg: '#F5F3EE',          // Sand background
  surface: '#FFFFFF',     // Card/Button surfaces
  primary: '#0F6E56',     // Dark green / teal accent
  primaryLight: '#E8F5F0',// Light teal for student card icon
  primaryBorder: '#0F6E56',
  ownerAccent: '#C2410C', // Orange / brown for owner card
  ownerLight: '#FFF3E8',  // Light orange for owner card icon
  textDark: '#1A1C1B',    // Near black typography
  textGray: '#6F7A74',    // Muted grey typography
  footerGray: '#A8A6A1',  // Dimmed footer text
  white: '#FFFFFF',
};

const { height } = Dimensions.get('window');

export default function EntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUserRole } = useApp();
  const [step, setStep] = useState<'welcome' | 'role'>('welcome');

  // Animation values for transition
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  const transitionToRole = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setStep('role');
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handleSelectRole = (role: 'student' | 'owner') => {
    setUserRole(role);
    if (role === 'owner') {
      router.push('/owner/login');
    } else {
      router.push('/student/onboarding');
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── WELCOME SCREEN STEP ── */}
      {step === 'welcome' && (
        <Animated.View 
          style={[
            s.stepContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Main Logo & Title */}
          <View style={s.centerBox}>
            <View style={s.logoCard}>
              {/* Stacked books icon representing libraries */}
              <View style={s.booksIcon}>
                <View style={[s.bookBar, { transform: [{ rotate: '-8deg' }] }]} />
                <View style={s.bookBar} />
                <View style={[s.bookBar, { transform: [{ rotate: '8deg' }] }]} />
              </View>
            </View>
            <Text style={s.welcomeTitle}>LibConnect</Text>
            <Text style={s.welcomeSub}>
              The best study spaces{'\n'}all in one place
            </Text>
          </View>

          {/* Action Button & Footer */}
          <View style={s.bottomBox}>
            <TouchableOpacity 
              testID="shuru-karo-btn"
              style={s.primaryBtn} 
              onPress={transitionToRole}
              activeOpacity={0.9}
            >
              <Text style={s.btnText}>Get Started</Text>
            </TouchableOpacity>

            <Text style={s.footerText}>Your Study Partner</Text>
          </View>
        </Animated.View>
      )}

      {/* ── ROLE SELECTION SCREEN STEP ── */}
      {step === 'role' && (
        <Animated.View 
          style={[
            s.stepContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Top Logo & Title */}
          <View style={s.roleHeaderBox}>
            <View style={s.smallLogoCard}>
              <View style={s.smallBooksIcon}>
                <View style={[s.smallBookBar, { transform: [{ rotate: '-8deg' }] }]} />
                <View style={s.smallBookBar} />
                <View style={[s.smallBookBar, { transform: [{ rotate: '8deg' }] }]} />
              </View>
            </View>
            <Text style={s.roleTitle}>Who are you?</Text>
            <Text style={s.roleSub}>Select your role to get started</Text>
          </View>

          {/* Role Cards List */}
          <View style={s.cardsBox}>
            
            {/* Student Card */}
            <TouchableOpacity 
              testID="student-btn"
              style={[s.roleCard, s.studentCardBorder]} 
              onPress={() => handleSelectRole('student')}
              activeOpacity={0.9}
            >
              <View style={[s.cardIconBox, { backgroundColor: C.primaryLight }]}>
                <Ionicons name="school" size={28} color={C.primary} />
              </View>
              <View style={s.cardTextBox}>
                <Text style={s.cardTitle}>I am a Student</Text>
                <Text style={s.cardSub}>
                  Find libraries,{'\n'}book your seat,{'\n'}and start studying
                </Text>
              </View>
              <View style={[s.cardArrowCircle, { backgroundColor: C.primary }]}>
                <Ionicons name="arrow-forward" size={18} color={C.white} />
              </View>
            </TouchableOpacity>

            {/* Library Owner Card */}
            <TouchableOpacity 
              testID="owner-btn"
              style={[s.roleCard, s.ownerCardBorder]} 
              onPress={() => handleSelectRole('owner')}
              activeOpacity={0.9}
            >
              <View style={[s.cardIconBox, { backgroundColor: C.ownerLight }]}>
                <Ionicons name="business" size={28} color={C.ownerAccent} />
              </View>
              <View style={s.cardTextBox}>
                <Text style={s.cardTitle}>I am a Library Owner</Text>
                <Text style={s.cardSub}>
                  Manage your library,{'\n'}track students,{'\n'}and collect fees
                </Text>
              </View>
              <View style={[s.cardArrowCircle, { backgroundColor: C.ownerAccent }]}>
                <Ionicons name="arrow-forward" size={18} color={C.white} />
              </View>
            </TouchableOpacity>

          </View>

          {/* Footer */}
          <View style={s.roleBottomBox}>
            <Text style={s.footerText}>LibConnect App</Text>
          </View>
        </Animated.View>
      )}

      {/* Down Arrow Circle Button (Shared premium design feature) */}
      <View style={s.fixedArrowContainer}>
        <View style={s.arrowWhiteCircle}>
          <Ionicons name="arrow-down" size={20} color={C.textDark} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },

  // ── WELCOME SCREEN SPECIFIC STYLES ──
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.1,
  },
  logoCard: {
    width: 110,
    height: 110,
    backgroundColor: C.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 28,
  },
  booksIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 48,
    gap: 6,
  },
  bookBar: {
    width: 10,
    height: 38,
    backgroundColor: C.white,
    borderRadius: 4,
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: C.textDark,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 16,
    color: C.textGray,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  bottomBox: {
    alignItems: 'center',
    marginBottom: 60,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  btnText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
  },

  // ── ROLE SELECTION SCREEN SPECIFIC STYLES ──
  roleHeaderBox: {
    alignItems: 'center',
    paddingTop: height * 0.05,
    marginBottom: 24,
  },
  smallLogoCard: {
    width: 80,
    height: 80,
    backgroundColor: C.primary,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  smallBooksIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 34,
    gap: 4,
  },
  smallBookBar: {
    width: 7,
    height: 28,
    backgroundColor: C.white,
    borderRadius: 3,
  },
  roleTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.textDark,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  roleSub: {
    fontSize: 15,
    color: C.textGray,
    fontWeight: '500',
  },
  cardsBox: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    shadowColor: C.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  studentCardBorder: {
    borderColor: C.primaryBorder,
  },
  ownerCardBorder: {
    borderColor: C.ownerAccent,
  },
  cardIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextBox: {
    flex: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12.5,
    color: C.textGray,
    lineHeight: 17,
    fontWeight: '500',
  },
  cardArrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBottomBox: {
    alignItems: 'center',
    marginBottom: 60,
  },

  // ── SHARED FOOTER COMPONENTS ──
  footerText: {
    fontSize: 12,
    color: C.footerGray,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  fixedArrowContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -24,
    alignItems: 'center',
    zIndex: 10,
  },
  arrowWhiteCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});
