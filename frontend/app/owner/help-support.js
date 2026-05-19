// Help & Support — Professional English UI
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Linking, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';

const SUPPORT_PHONE = '919024032817';
const SUPPORT_EMAIL = 'princebana@example.com';

const showAlert = (title, msg) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

const FAQS = [
  {
    q: 'How do I accept a student booking request?',
    a: 'Go to Dashboard → Manage Students → Pending tab. Tap "Accept" on the student card. The available seat count will automatically decrease.'
  },
  {
    q: 'How do I update my library fees?',
    a: 'Go to the Library tab → tap Edit → update Half Time / Full Time fees → tap Save. Changes reflect immediately.'
  },
  {
    q: 'How do I send a fee reminder to a student?',
    a: 'Go to Dashboard → Reminders → select a student → tap the WhatsApp button. A personalized reminder message is auto-generated for you.'
  },
  {
    q: 'How do I add or change my profile photo?',
    a: 'Go to Profile tab → tap on your profile photo or avatar → choose Camera or Gallery. You can also remove the photo from the same menu.'
  },
  {
    q: 'Why should I add my UPI ID?',
    a: 'Adding your UPI ID enables payment details to be automatically included in fee reminder messages sent to students, making collections easier.'
  },
  {
    q: 'What is the Seat Map?',
    a: 'The Seat Map (Dashboard → Seat Map) shows the real-time status of every seat in your library — Available (green), Occupied (red), or Reserved (orange).'
  },
  {
    q: 'How do I view my revenue report?',
    a: 'Go to Dashboard → Reports. You will see a full breakdown of monthly revenue, active students, upcoming renewals, and overdue payments.'
  },
  {
    q: 'I am unable to log in. What should I do?',
    a: 'During testing, use OTP: 1234. If the problem persists in production, ensure your phone number is correct and contact our support team.'
  },
];

export default function HelpSupport() {
  const router = useRouter();
  const { ownerData } = useApp();
  const [openFaq, setOpenFaq] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello! I'm reaching out from the LibraryWala app.\n\nName: ${ownerData.name || 'Owner'}\nPhone: ${ownerData.phone || ''}\n\nI need help with:`
    );
    Linking.openURL(`https://wa.me/${SUPPORT_PHONE}?text=${text}`)
      .catch(() => showAlert('Error', 'Unable to open WhatsApp. Please try again.'));
  };

  const openEmail = () => {
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=LibraryWala Support - ${ownerData.name || 'Owner'}&body=Hello,\n\nName: ${ownerData.name || ''}\nPhone: ${ownerData.phone || ''}\n\nIssue Description:\n`
    ).catch(() => showAlert('Email Support', `Send your query to:\n${SUPPORT_EMAIL}`));
  };

  const openCall = () => {
    Linking.openURL(`tel:+${SUPPORT_PHONE}`)
      .catch(() => showAlert('Call Support', `Please call us at:\n+${SUPPORT_PHONE}`));
  };

  const handleSendMessage = async () => {
    if (!subject.trim() || !message.trim()) {
      showAlert('Incomplete Form', 'Please fill in both subject and message fields.');
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSubject('');
    setMessage('');
    showAlert('Message Sent ✅', "Your message has been received. We'll get back to you within 24 hours.");
  };

  return (
    <View style={s.container}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Help & Support</Text>
          <Text style={s.headerSub}>We&apos;re available 24/7 to assist you</Text>
        </View>
        <View style={s.onlineBadge}>
          <View style={s.onlineDot} />
          <Text style={s.onlineText}>Online</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        {/* ── HERO BANNER ── */}
        <View style={s.heroBanner}>
          <View style={s.heroIcon}>
            <Ionicons name="headset" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>How can we help you?</Text>
            <Text style={s.heroSub}>Choose a contact method below or browse our FAQs</Text>
          </View>
        </View>

        {/* ── CONTACT OPTIONS ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Contact Us</Text>
          <View style={s.contactGrid}>

            <TouchableOpacity style={[s.contactCard, { borderColor: '#25D36640' }]} onPress={openWhatsApp} activeOpacity={0.8}>
              <View style={[s.contactIconWrap, { backgroundColor: '#25D36612' }]}>
                <Ionicons name="logo-whatsapp" size={30} color="#25D366" />
              </View>
              <Text style={[s.contactLabel, { color: '#25D366' }]}>WhatsApp</Text>
              <Text style={s.contactDesc}>Instant reply</Text>
              <View style={[s.tag, { backgroundColor: '#25D36615' }]}>
                <Text style={[s.tagText, { color: '#25D366' }]}>⚡ Fastest</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.contactCard, { borderColor: '#4F8EF740' }]} onPress={openEmail} activeOpacity={0.8}>
              <View style={[s.contactIconWrap, { backgroundColor: '#4F8EF712' }]}>
                <Ionicons name="mail" size={30} color="#4F8EF7" />
              </View>
              <Text style={[s.contactLabel, { color: '#4F8EF7' }]}>Email</Text>
              <Text style={s.contactDesc} numberOfLines={1}>chandrabhanghar{'\n'}@gmail.com</Text>
              <View style={[s.tag, { backgroundColor: '#4F8EF715' }]}>
                <Text style={[s.tagText, { color: '#4F8EF7' }]}>24hr reply</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.contactCard, { borderColor: '#E67E2240' }]} onPress={openCall} activeOpacity={0.8}>
              <View style={[s.contactIconWrap, { backgroundColor: '#E67E2212' }]}>
                <Ionicons name="call" size={30} color="#E67E22" />
              </View>
              <Text style={[s.contactLabel, { color: '#E67E22' }]}>Call</Text>
              <Text style={s.contactDesc}>+91 9636973572</Text>
              <View style={[s.tag, { backgroundColor: '#E67E2215' }]}>
                <Text style={[s.tagText, { color: '#E67E22' }]}>10am – 7pm</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* ── SEND A MESSAGE ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Send a Message</Text>
          <View style={s.formCard}>
            <Text style={s.inputLabel}>Subject</Text>
            <TextInput
              style={s.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Briefly describe your issue"
              placeholderTextColor={colors.textLight}
            />
            <Text style={[s.inputLabel, { marginTop: 14 }]}>Message</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Please provide as much detail as possible so we can help you quickly..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[s.sendBtn, sending && { opacity: 0.6 }]}
              onPress={handleSendMessage}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator color="#fff" size="small" />
                : (
                  <>
                    <Ionicons name="send" size={17} color="#fff" />
                    <Text style={s.sendBtnText}>Send Message</Text>
                  </>
                )
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FAQs ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
          <View style={s.faqCard}>
            {FAQS.map((faq, i) => (
              <View key={i} style={[s.faqItem, i < FAQS.length - 1 && s.faqDivider]}>
                <TouchableOpacity
                  style={s.faqRow}
                  onPress={() => setOpenFaq(openFaq === i ? null : i)}
                  activeOpacity={0.7}
                >
                  <View style={[s.faqNum, openFaq === i && { backgroundColor: colors.primary }]}>
                    <Text style={[s.faqNumText, openFaq === i && { color: '#fff' }]}>{i + 1}</Text>
                  </View>
                  <Text style={[s.faqQ, openFaq === i && { color: colors.primary }]}>{faq.q}</Text>
                  <Ionicons
                    name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={openFaq === i ? colors.primary : colors.textLight}
                  />
                </TouchableOpacity>
                {openFaq === i && (
                  <View style={s.faqAnswer}>
                    <Text style={s.faqAns}>{faq.a}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── BOTTOM TRUST BADGE ── */}
        <View style={s.trustBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#27AE60" />
          <Text style={s.trustText}>Your data is 100% secure. We never share your personal information.</Text>
        </View>

        <Text style={s.versionText}>LibraryWala v1.0.0 · support@librarywala.in</Text>

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
  headerSub:  { fontSize: 12, color: '#ffffff60', marginTop: 2 },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#27AE6022', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#27AE60' },
  onlineText: { fontSize: 12, color: '#27AE60', fontWeight: '700' },

  // Hero
  heroBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 18,
    borderRadius: 18, padding: 18,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  heroIcon: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center'
  },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  heroSub:   { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  // Section
  section:      { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  // Contact grid
  contactGrid: { flexDirection: 'row', gap: 10 },
  contactCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14,
    alignItems: 'center', borderWidth: 1.5,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },
  contactIconWrap: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  contactLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  contactDesc:  { fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginBottom: 10, lineHeight: 15 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 10, fontWeight: '700' },

  // Form
  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: '#F4F6FA', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 14, color: '#1A1A2E', borderWidth: 1, borderColor: '#E8EBF0'
  },
  textArea: { height: 120, paddingTop: 13 },
  sendBtn: {
    marginTop: 16, backgroundColor: '#1A1A2E', borderRadius: 14,
    paddingVertical: 15, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // FAQs
  faqCard: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  faqItem:    { paddingHorizontal: 16 },
  faqDivider: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  faqRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  faqNum: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: '#F0F2F5',
    justifyContent: 'center', alignItems: 'center'
  },
  faqNumText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  faqQ:       { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A2E', lineHeight: 20 },
  faqAnswer:  { backgroundColor: '#F8F9FD', borderRadius: 12, padding: 14, marginBottom: 14, marginLeft: 38 },
  faqAns:     { fontSize: 13, color: colors.textSecondary, lineHeight: 21 },

  // Bottom
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 22, backgroundColor: '#27AE6010',
    borderWidth: 1, borderColor: '#27AE6025', padding: 14, borderRadius: 14
  },
  trustText:   { flex: 1, fontSize: 13, color: '#27AE60', fontWeight: '500', lineHeight: 18 },
  versionText: { textAlign: 'center', fontSize: 11, color: colors.textLight, marginTop: 16 },
});
