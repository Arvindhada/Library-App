// About App — Full Professional Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';

const APP_VERSION   = '1.0.0';
const BUILD_NUMBER  = '2026.04.27';
const RELEASE_DATE  = 'April 27, 2026';
const DEVELOPER     = 'Prince Bana';
const EMAIL         = 'princebana@example.com'; // Placeholder, user can change
const PHONE         = '+91 XXXXX XXXXX';         // Professional placeholder
const INSTAGRAM_URL = 'https://instagram.com';
const LINKEDIN_URL  = 'https://linkedin.com';
const PLAYSTORE_URL = 'https://play.google.com/store';
const GITHUB_URL    = 'https://github.com';

const showAlert = (title, msg) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

const FEATURES = [
  { icon: 'people',               color: '#4F8EF7', text: 'Student Management'       },
  { icon: 'calendar',             color: '#27AE60', text: 'Seat Booking System'       },
  { icon: 'cash',                 color: '#E67E22', text: 'Revenue Reports'           },
  { icon: 'logo-whatsapp',        color: '#25D366', text: 'WhatsApp Fee Reminders'   },
  { icon: 'grid',                 color: '#8E6FEC', text: 'Visual Seat Map'           },
  { icon: 'shield-checkmark',     color: '#E74C3C', text: 'Secure Authentication'    },
  { icon: 'bar-chart',            color: '#F1C40F', text: 'Analytics Dashboard'      },
  { icon: 'cloud-done',           color: '#1ABC9C', text: 'MongoDB Atlas Cloud'       },
];

const TECH_STACK = [
  { name: 'React Native',  role: 'Cross-Platform App',    icon: 'phone-portrait', color: '#61DAFB' },
  { name: 'Expo',          role: 'Development Framework', icon: 'layers',         color: '#000000' },
  { name: 'Node.js',       role: 'Backend Server',        icon: 'server',         color: '#68A063' },
  { name: 'MongoDB Atlas', role: 'Cloud Database',        icon: 'cloud',          color: '#4DB33D' },
  { name: 'JWT',           role: 'Secure Auth',           icon: 'lock-closed',    color: '#D63AFF' },
  { name: 'WhatsApp API',  role: 'Messaging',             icon: 'chatbubbles',    color: '#25D366' },
];

const CHANGELOG = [
  {
    version: 'v1.0.0',
    date: 'April 2026',
    tag: 'Latest',
    tagColor: '#27AE60',
    changes: [
      'Initial release of LibraryWala',
      'Owner dashboard with live stats',
      'Student booking & seat management',
      'WhatsApp fee reminders',
      'MongoDB Atlas cloud integration',
      'Revenue reports & analytics',
    ],
  },
  {
    version: 'v0.9.0',
    date: 'March 2026',
    tag: 'Beta',
    tagColor: '#E67E22',
    changes: [
      'Beta testing with library owners',
      'Core booking flow implemented',
      'Phone OTP authentication',
      'Basic library listing',
    ],
  },
];

export default function AboutApp() {
  const router = useRouter();

  const openLink = (url, fallback) => {
    Linking.openURL(url).catch(() => showAlert('Link', fallback || url));
  };

  return (
    <View style={s.container}>

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>About App</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        {/* ── APP IDENTITY CARD ── */}
        <View style={s.identityCard}>
          <View style={s.appLogoWrap}>
            <Ionicons name="library" size={50} color={colors.primary} />
          </View>
          <Text style={s.appName}>LibraryWala</Text>
          <Text style={s.appTagline}>Smart Library Management Platform</Text>
          <View style={s.versionRow}>
            <View style={s.versionBadge}>
              <Text style={s.versionBadgeText}>v{APP_VERSION}</Text>
            </View>
            <View style={[s.versionBadge, { backgroundColor: '#27AE6020', borderColor: '#27AE6040' }]}>
              <Ionicons name="checkmark-circle" size={12} color="#27AE60" />
              <Text style={[s.versionBadgeText, { color: '#27AE60' }]}>Up to date</Text>
            </View>
          </View>
          <Text style={s.buildInfo}>Build {BUILD_NUMBER} · Released {RELEASE_DATE}</Text>
        </View>

        {/* ── DESCRIPTION ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📖 What is LibraryWala?</Text>
          <Text style={s.cardText}>
            LibraryWala is a comprehensive library management application built for study library owners across India. It digitizes the entire library workflow — from student onboarding and seat allocation to fee collection and WhatsApp reminders.{'\n\n'}
            Students can discover nearby libraries, view available seats, and request bookings. Library owners get a powerful dashboard to manage everything in one place.
          </Text>
        </View>

        {/* ── OUR VISION ── */}
        <View style={[s.card, { backgroundColor: colors.primary }]}>
          <Text style={[s.cardTitle, { color: '#fff' }]}>🎯 Our Vision</Text>
          <Text style={[s.cardText, { color: 'rgba(255,255,255,0.9)' }]}>
            To empower every library owner in India with world-class digital tools, making education and study spaces more accessible and organized for everyone.
          </Text>
        </View>

        {/* ── KEY FEATURES ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>⚡ Key Features</Text>
          <View style={s.featuresGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={s.featureItem}>
                <View style={[s.featureIcon, { backgroundColor: f.color + '18' }]}>
                  <Ionicons name={f.icon} size={20} color={f.color} />
                </View>
                <Text style={s.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── TECH STACK ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🛠 Built With</Text>
          {TECH_STACK.map((t, i) => (
            <View key={i} style={[s.techRow, i > 0 && s.techBorder]}>
              <View style={[s.techIcon, { backgroundColor: t.color + '18' }]}>
                <Ionicons name={t.icon} size={18} color={t.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.techName}>{t.name}</Text>
                <Text style={s.techRole}>{t.role}</Text>
              </View>
              <View style={[s.techDot, { backgroundColor: t.color }]} />
            </View>
          ))}
        </View>

        {/* ── DEVELOPER ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>👨‍💻 Developer</Text>
          <View style={s.devCard}>
            <View style={s.devAvatar}>
              <Text style={s.devInitials}>PB</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.devName}>{DEVELOPER}</Text>
              <Text style={s.devRole}>Founder & Developer · LibraryWala</Text>
            </View>
          </View>
          <View style={s.devContacts}>
            <TouchableOpacity style={s.devContactBtn} onPress={() => openLink(`mailto:${EMAIL}`, EMAIL)}>
              <Ionicons name="mail-outline" size={16} color={colors.primary} />
              <Text style={s.devContactText}>{EMAIL}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.devContactBtn} onPress={() => openLink(`tel:${PHONE}`, PHONE)}>
              <Ionicons name="call-outline" size={16} color="#27AE60" />
              <Text style={[s.devContactText, { color: '#27AE60' }]}>{PHONE}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.socialRow}>
            <TouchableOpacity style={s.socialIcon} onPress={() => openLink(INSTAGRAM_URL)}>
              <Ionicons name="logo-instagram" size={20} color="#E1306C" />
            </TouchableOpacity>
            <TouchableOpacity style={s.socialIcon} onPress={() => openLink(LINKEDIN_URL)}>
              <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
            </TouchableOpacity>
            <TouchableOpacity style={s.socialIcon} onPress={() => openLink(GITHUB_URL)}>
              <Ionicons name="logo-github" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CHANGELOG ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📋 Version History</Text>
          {CHANGELOG.map((log, i) => (
            <View key={i} style={[s.logItem, i > 0 && { marginTop: 16 }]}>
              <View style={s.logHeader}>
                <Text style={s.logVersion}>{log.version}</Text>
                <View style={[s.logTag, { backgroundColor: log.tagColor + '20', borderColor: log.tagColor + '40' }]}>
                  <Text style={[s.logTagText, { color: log.tagColor }]}>{log.tag}</Text>
                </View>
                <Text style={s.logDate}>{log.date}</Text>
              </View>
              {log.changes.map((c, j) => (
                <View key={j} style={s.changeRow}>
                  <View style={s.changeDot} />
                  <Text style={s.changeText}>{c}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* ── RATE & SHARE ── */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#F1C40F15', borderColor: '#F1C40F40' }]}
            onPress={() => openLink(PLAYSTORE_URL, 'Coming soon on Play Store! ⭐')}
          >
            <Ionicons name="star" size={20} color="#F1C40F" />
            <Text style={[s.actionBtnText, { color: '#F1C40F' }]}>Rate App</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#4F8EF715', borderColor: '#4F8EF740' }]}
            onPress={() => router.push('/owner/help-support')}
          >
            <Ionicons name="help-circle" size={20} color="#4F8EF7" />
            <Text style={[s.actionBtnText, { color: '#4F8EF7' }]}>Get Help</Text>
          </TouchableOpacity>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <Ionicons name="heart" size={14} color="#E74C3C" />
          <Text style={s.footerText}>Made with love in India 🇮🇳</Text>
        </View>
        <Text style={s.copyright}>© 2026 LibraryWala Technologies. All rights reserved.</Text>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },

  // Header
  header: {
    backgroundColor: '#1A1A2E', paddingTop: 52, paddingBottom: 20,
    paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#ffffff15', justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  // Identity Card
  identityCard: {
    backgroundColor: '#1A1A2E', alignItems: 'center',
    paddingVertical: 40, paddingHorizontal: 24, marginBottom: -20,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32
  },
  appLogoWrap: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: '#fff', justifyContent: 'center',
    alignItems: 'center', marginBottom: 20,
    elevation: 10, shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }
  },
  appName:    { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  appTagline: { fontSize: 15, color: '#ffffff90', marginTop: 8, marginBottom: 20, fontWeight: '500' },
  versionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  versionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 24
  },
  versionBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  buildInfo: { fontSize: 12, color: '#ffffff50' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 16,
    marginTop: 16, padding: 20,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 16, letterSpacing: 0.3 },
  cardText:  { fontSize: 14, color: '#4A4A4A', lineHeight: 22 },

  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureItem: {
    width: '47%', flexDirection: 'row', alignItems: 'center',
    gap: 10, backgroundColor: '#F8F9FD', borderRadius: 12, padding: 12
  },
  featureIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1, fontSize: 12, color: '#1A1A2E', fontWeight: '600', lineHeight: 16 },

  // Tech Stack
  techRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  techBorder: { borderTopWidth: 1, borderTopColor: '#F2F4F7' },
  techIcon:   { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  techName:   { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  techRole:   { fontSize: 13, color: '#6B7280', marginTop: 2 },
  techDot:    { width: 8, height: 8, borderRadius: 4 },

  // Developer
  devCard:      { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  devAvatar:    { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 8 },
  devInitials:  { fontSize: 22, fontWeight: '900', color: '#fff' },
  devName:      { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  devRole:      { fontSize: 13, color: '#6B7280', marginTop: 4 },
  devContacts:  { gap: 12 },
  devContactBtn:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8F9FB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EDF0F3' },
  devContactText:{ fontSize: 14, color: colors.primary, fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 16, borderTopWidth: 1, borderTopColor: '#F0F2F5', paddingTop: 16 },
  socialIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F6FA', justifyContent: 'center', alignItems: 'center' },

  // Changelog
  logItem:    {},
  logHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  logVersion: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  logTag:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  logTagText: { fontSize: 11, fontWeight: '700' },
  logDate:    { marginLeft: 'auto', fontSize: 12, color: colors.textSecondary },
  changeRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  changeDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
  changeText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 14 },
  actionBtn:  {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  // Footer
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  footerText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  copyright:  { textAlign: 'center', fontSize: 11, color: colors.textLight, marginTop: 6, marginBottom: 4 },
});
