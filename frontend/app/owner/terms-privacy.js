// Terms & Privacy — Full Professional Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';

const LAST_UPDATED = 'April 27, 2026';
const APP_NAME     = 'LibraryWala';
const COMPANY      = 'LibraryWala Technologies';
const EMAIL        = 'princebana@example.com';
const PHONE        = '+91 XXXXX XXXXX';

const SECTIONS = [
  {
    icon: 'document-text',
    color: '#4F8EF7',
    title: '1. Terms of Service',
    content: [
      {
        heading: 'Acceptance of Terms',
        text: `By downloading, installing, or using the ${APP_NAME} application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our application.`,
      },
      {
        heading: 'Eligibility',
        text: 'You must be at least 18 years old to register as a library owner on LibraryWala. Students may use the app with parental consent if under 18.',
      },
      {
        heading: 'Account Responsibility',
        text: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately at ' + EMAIL + ' if you suspect any unauthorized use of your account.',
      },
      {
        heading: 'Prohibited Activities',
        text: 'Users must not: misuse the platform for fraudulent bookings, impersonate other users or library owners, upload harmful or illegal content, or attempt to interfere with the app\'s technical operations.',
      },
      {
        heading: 'Service Availability',
        text: `${COMPANY} strives to maintain 99.9% uptime but does not guarantee uninterrupted service. We reserve the right to suspend or terminate services for maintenance or security purposes.`,
      },
    ],
  },
  {
    icon: 'shield-checkmark',
    color: '#27AE60',
    title: '2. Privacy Policy',
    content: [
      {
        heading: 'Information We Collect',
        text: 'We collect: your mobile phone number (for authentication), your name (for profile), library details you provide, booking and transaction records, and device information for analytics.',
      },
      {
        heading: 'How We Use Your Data',
        text: 'Your data is used to: authenticate your identity, manage library and student records, send fee reminders via WhatsApp, improve app performance, and provide customer support.',
      },
      {
        heading: 'Data Storage & Security',
        text: 'All data is securely stored on MongoDB Atlas cloud servers with end-to-end encryption. We use industry-standard SSL/TLS protocols to protect data in transit.',
      },
      {
        heading: 'Data Sharing',
        text: 'We do NOT sell, trade, or rent your personal information to third parties. Data may be shared only when required by law or to protect the rights and safety of our users.',
      },
      {
        heading: 'Data Retention',
        text: 'Your data is retained as long as your account is active. You may request deletion of your account and associated data by contacting us at ' + EMAIL + '.',
      },
    ],
  },
  {
    icon: 'phone-portrait',
    color: '#8E6FEC',
    title: '3. App Usage Policy',
    content: [
      {
        heading: 'Library Owner Responsibilities',
        text: 'Library owners are responsible for the accuracy of library details, timely response to student booking requests, maintaining seat availability records, and complying with local regulations.',
      },
      {
        heading: 'Student Conduct',
        text: 'Students must provide accurate personal information during registration, respect library rules set by the owner, and not make fraudulent booking requests.',
      },
      {
        heading: 'Fee & Payment Terms',
        text: 'LibraryWala is a platform connecting owners and students. All fee transactions are handled directly between the owner and student. LibraryWala does not process payments and is not responsible for payment disputes.',
      },
      {
        heading: 'WhatsApp Integration',
        text: 'Our fee reminder feature uses WhatsApp Business API. By using this feature, you consent to messages being sent through WhatsApp. Standard WhatsApp messaging rates may apply.',
      },
    ],
  },
  {
    icon: 'refresh-circle',
    color: '#E67E22',
    title: '4. Updates & Changes',
    content: [
      {
        heading: 'Policy Updates',
        text: 'We may update these Terms & Privacy Policy from time to time. Updated policies will be reflected in the app with a new "Last Updated" date. Continued use of the app constitutes acceptance of the revised terms.',
      },
      {
        heading: 'Notification of Changes',
        text: 'Significant changes to our policies will be communicated via in-app notifications or email to your registered contact. We encourage you to review these policies periodically.',
      },
    ],
  },
  {
    icon: 'mail',
    color: '#E74C3C',
    title: '5. Contact & Grievances',
    content: [
      {
        heading: 'Contact Information',
        text: `For any questions, complaints, or concerns regarding these terms:\n\n📧 Email: ${EMAIL}\n📞 Phone: ${PHONE}\n\nWe aim to respond to all queries within 24–48 business hours.`,
      },
      {
        heading: 'Governing Law',
        text: 'These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Rajasthan, India.',
      },
    ],
  },
];

export default function TermsPrivacy() {
  const router = useRouter();
  const [openSection, setOpenSection] = useState(null);

  return (
    <View style={s.container}>

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Terms & Privacy</Text>
          <Text style={s.headerSub}>Last updated: {LAST_UPDATED}</Text>
        </View>
        <View style={s.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#27AE60" />
          <Text style={s.verifiedText}>Verified</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        {/* INTRO BANNER */}
        <View style={s.introBanner}>
          <View style={s.introIconWrap}>
            <Ionicons name="document-text" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.introTitle}>Our Commitment to You</Text>
            <Text style={s.introSub}>
              {APP_NAME} is committed to protecting your privacy and providing a transparent, safe experience. Please read our complete policy below.
            </Text>
          </View>
        </View>

        {/* SECTIONS */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {SECTIONS.map((sec, i) => (
            <View key={i} style={s.sectionCard}>
              {/* Section Header */}
              <TouchableOpacity
                style={s.sectionHeader}
                onPress={() => setOpenSection(openSection === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={[s.sectionIcon, { backgroundColor: sec.color + '18' }]}>
                  <Ionicons name={sec.icon} size={20} color={sec.color} />
                </View>
                <Text style={[s.sectionTitle, { color: sec.color }]}>{sec.title}</Text>
                <Ionicons
                  name={openSection === i ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={openSection === i ? sec.color : colors.textLight}
                />
              </TouchableOpacity>

              {/* Section Content */}
              {openSection === i && (
                <View style={s.sectionBody}>
                  {sec.content.map((item, j) => (
                    <View key={j} style={[s.clause, j > 0 && s.clauseBorder]}>
                      <View style={s.clauseHeader}>
                        <View style={[s.clauseDot, { backgroundColor: sec.color }]} />
                        <Text style={s.clauseTitle}>{item.heading}</Text>
                      </View>
                      <Text style={s.clauseText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* CONTACT BOX */}
        <View style={s.contactBox}>
          <Ionicons name="mail-open-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.contactTitle}>Have Questions?</Text>
            <Text style={s.contactSub}>{EMAIL} · {PHONE}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <Text style={s.footer}>
          © 2026 {COMPANY}. All rights reserved.{'\n'}
          These terms are effective as of {LAST_UPDATED}.
        </Text>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },

  // Header
  header: {
    backgroundColor: '#1A1A2E', paddingTop: 52, paddingBottom: 20,
    paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#ffffff15', justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub:   { fontSize: 11, color: '#ffffff60', marginTop: 2 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#27AE6020', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20
  },
  verifiedText: { fontSize: 11, color: '#27AE60', fontWeight: '700' },

  // Intro
  introBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 18,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  introIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center'
  },
  introTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  introSub:   { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  // Section Cards
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden'
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16
  },
  sectionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700' },

  // Section Body
  sectionBody:  { paddingHorizontal: 16, paddingBottom: 16 },
  clause:       { paddingTop: 14 },
  clauseBorder: { borderTopWidth: 1, borderTopColor: '#F0F2F5', marginTop: 14 },
  clauseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  clauseDot:    { width: 8, height: 8, borderRadius: 4 },
  clauseTitle:  { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  clauseText:   { fontSize: 13, color: colors.textSecondary, lineHeight: 20, paddingLeft: 16 },

  // Contact
  contactBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8,
    borderRadius: 16, padding: 16,
    borderLeftWidth: 4, borderLeftColor: colors.primary
  },
  contactTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  contactSub:   { fontSize: 12, color: colors.textSecondary, marginTop: 3 },

  // Footer
  footer: {
    textAlign: 'center', fontSize: 11,
    color: colors.textLight, lineHeight: 18,
    marginHorizontal: 16, marginTop: 16
  },
});
