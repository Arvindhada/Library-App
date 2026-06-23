import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LAST_UPDATED = '23 June 2025';
const APP_NAME = 'LibConnect';
const OWNER_NAME = 'Arvind Kumar';
const SUPPORT_EMAIL = 'arvindhada009@gmail.com';
const SUPPORT_PHONE = '+91 9351471243';

const Section = ({ title, children }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Para = ({ children }) => <Text style={s.para}>{children}</Text>;
const Bullet = ({ children }) => (
  <View style={s.bulletRow}>
    <Text style={s.bullet}>•</Text>
    <Text style={s.bulletText}>{children}</Text>
  </View>
);

export default function PrivacyPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F3EE" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1A1C1B" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="shield-checkmark" size={36} color="#0F6E56" />
          </View>
          <Text style={s.heroTitle}>{APP_NAME} Privacy Policy</Text>
          <Text style={s.heroSub}>Last updated: {LAST_UPDATED}</Text>
        </View>

        <Section title="1. Who We Are">
          <Para>
            {APP_NAME} ("we", "our", "us") is a library seat booking platform developed and operated by {OWNER_NAME}. This app helps students find and book seats at local libraries, and helps library owners manage their seats and students.
          </Para>
          <Para>Contact us at: {SUPPORT_EMAIL} | {SUPPORT_PHONE}</Para>
        </Section>

        <Section title="2. What Data We Collect">
          <Para>We collect the following information when you use LibConnect:</Para>
          <Bullet>Full name and mobile phone number (for account creation and login)</Bullet>
          <Bullet>Profile photo (optional, stored on Cloudinary)</Bullet>
          <Bullet>Study goal / target exam (optional, for student profile)</Bullet>
          <Bullet>Device location (to show nearby libraries on the map)</Bullet>
          <Bullet>Library details (name, address, photos, fee structure — for library owners)</Bullet>
          <Bullet>Booking records (seat number, shift, admission date, payment status)</Bullet>
          <Bullet>UPI ID (for library owners, to display payment QR)</Bullet>
          <Bullet>OTP verification codes (used only for login, never stored)</Bullet>
        </Section>

        <Section title="3. How We Use Your Data">
          <Para>Your data is used only for the following purposes:</Para>
          <Bullet>To create and manage your account (student or library owner)</Bullet>
          <Bullet>To display available library seats and enable bookings</Bullet>
          <Bullet>To show your location on the map relative to nearby libraries</Bullet>
          <Bullet>To allow library owners to manage student records and seat assignments</Bullet>
          <Bullet>To send booking confirmation details via WhatsApp (only when you tap "Contact Owner")</Bullet>
          <Bullet>To display your profile photo within the app</Bullet>
          <Bullet>We do NOT use your data for advertising or sell it to third parties</Bullet>
        </Section>

        <Section title="4. Data Storage & Security">
          <Para>
            Your data is stored on secure servers (MongoDB Atlas cloud database). Profile photos are stored on Cloudinary, a trusted media cloud service. We use JWT (JSON Web Token) authentication to keep your session secure. All API communication happens over HTTPS.
          </Para>
          <Para>
            We do not store OTP codes after verification. Phone numbers are stored with country code (+91) for identification purposes only.
          </Para>
        </Section>

        <Section title="5. Data Sharing">
          <Para>We do not sell, trade, or rent your personal data. Your data may be shared only in these limited cases:</Para>
          <Bullet>Between student and library owner: When a student books a seat, their name and phone number are visible to the respective library owner for seat management.</Bullet>
          <Bullet>Cloudinary (photo storage): Profile photos are uploaded to Cloudinary for hosting.</Bullet>
          <Bullet>WhatsApp: If you tap "Contact Owner" or "Help & Support", your phone opens WhatsApp with a pre-filled message. No data is sent automatically.</Bullet>
          <Bullet>We do not share data with advertisers, analytics firms, or any other third parties.</Bullet>
        </Section>

        <Section title="6. Location Data">
          <Para>
            LibConnect requests your device location permission to show nearby libraries on the Map tab. Location is used only within the app to calculate distances. We do not store or transmit your precise location to our servers — it is processed locally on your device.
          </Para>
          <Para>You can deny location permission at any time in your device settings. The app will still work, but distance information will not be shown.</Para>
        </Section>

        <Section title="7. Camera & Photo Access">
          <Para>
            The app requests access to your photo gallery (and optionally camera) only when you choose to upload a profile photo. Photos are uploaded to Cloudinary only when you explicitly tap "Save" after selecting a photo. We do not access your gallery without your action.
          </Para>
        </Section>

        <Section title="8. Your Rights (DPDP Act, 2023)">
          <Para>Under India's Digital Personal Data Protection Act 2023, you have the following rights:</Para>
          <Bullet>Right to Access: Request a copy of your personal data held by us.</Bullet>
          <Bullet>Right to Correction: Ask us to correct inaccurate or incomplete data.</Bullet>
          <Bullet>Right to Erasure: Request deletion of your account and personal data.</Bullet>
          <Bullet>Right to Grievance: File a complaint if you believe your data rights are violated.</Bullet>
          <Para>
            To exercise any of these rights, contact us at: {SUPPORT_EMAIL} or WhatsApp {SUPPORT_PHONE}. We will respond within 30 days.
          </Para>
        </Section>

        <Section title="9. Data Retention">
          <Para>
            We retain your data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days. Booking records may be retained for a short period for library owner reference before complete deletion.
          </Para>
        </Section>

        <Section title="10. Children's Privacy">
          <Para>
            LibConnect is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us immediately.
          </Para>
        </Section>

        <Section title="11. Changes to This Policy">
          <Para>
            We may update this Privacy Policy from time to time. When we make significant changes, we will update the "Last Updated" date at the top of this page. Continued use of the app after changes are made constitutes your acceptance of the updated policy.
          </Para>
        </Section>

        <Section title="12. Contact Us">
          <Para>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact:</Para>
          <Bullet>Name: {OWNER_NAME}</Bullet>
          <Bullet>Email: {SUPPORT_EMAIL}</Bullet>
          <Bullet>WhatsApp / Phone: {SUPPORT_PHONE}</Bullet>
          <Bullet>App: {APP_NAME} — Library Seat Booking</Bullet>
        </Section>

        <View style={s.footer}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#0F6E56" />
          <Text style={s.footerText}>Your privacy is our priority. We are committed to protecting your personal information.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3EE' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F5F3EE',
    borderBottomWidth: 1,
    borderBottomColor: '#E0DED9',
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1CFCA',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1C1B' },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 8,
  },
  heroIcon: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#9FE1CB',
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#1A1C1B', marginBottom: 6 },
  heroSub: { fontSize: 13, color: '#6F7A74', fontWeight: '500' },

  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0DED9',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F6E56',
    marginBottom: 12,
  },
  para: {
    fontSize: 14,
    color: '#3A3D3C',
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 4,
  },
  bullet: {
    fontSize: 14,
    color: '#0F6E56',
    marginRight: 8,
    lineHeight: 22,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#3A3D3C',
    lineHeight: 22,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5F0',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#9FE1CB',
    marginBottom: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: '#0F6E56',
    lineHeight: 20,
    fontWeight: '500',
  },
});
