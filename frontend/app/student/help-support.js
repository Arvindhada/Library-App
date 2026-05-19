import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, TextInput, LayoutAnimation, Platform, UIManager, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/context/AppContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    category: 'Booking Process',
    icon: 'calendar',
    items: [
      { q: 'How to book a seat?', a: 'Go to the Explore tab, find your preferred library, select a seat and shift, then tap "Book Now". The owner will review your request.' },
      { q: 'Can I choose my own seat?', a: 'Yes! Most libraries allow you to select a specific seat from their digital seat map during the booking process.' },
      { q: 'What are shifts?', a: 'Libraries usually offer Morning, Afternoon, Evening, or Full Day shifts to accommodate different study schedules.' },
    ]
  },
  {
    category: 'Payments & Fees',
    icon: 'wallet',
    items: [
      { q: 'How do I pay my fee?', a: 'Once your booking is accepted, go to the "Bookings" tab. You will see a "Pay Now" button which will allow you to pay via UPI or other methods.' },
      { q: 'Is my payment secure?', a: 'Yes, we use industry-standard encrypted payment gateways to ensure your transactions are 100% safe.' },
      { q: 'Can I get a refund?', a: 'Refund policies vary by library. Please check the specific library details or contact the owner before booking.' },
    ]
  },
  {
    category: 'My Account',
    icon: 'person-circle',
    items: [
      { q: 'How to change my city?', a: 'Go to Profile > Edit Profile. You can update your city there to see libraries near your new location.' },
      { q: 'How to delete my account?', a: 'Please contact our support team at princebana499@gmail.com for account deletion requests.' },
    ]
  }
];

const FAQItem = ({ item, tColors, isDarkMode }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity 
      style={[
        s.faqCard, 
        { 
          backgroundColor: tColors.cardBg, 
          borderColor: isDarkMode ? '#333' : '#F1F5F9',
          shadowColor: '#000',
          shadowOpacity: isDarkMode ? 0.2 : 0.04,
        }
      ]} 
      onPress={toggle} 
      activeOpacity={0.8}
    >
      <View style={s.faqHeader}>
        <Text style={[s.question, { color: tColors.textDark }]}>{item.q}</Text>
        <View style={[s.arrowCircle, { backgroundColor: expanded ? tColors.primary : (isDarkMode ? '#333' : '#F8FAFC') }]}>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={expanded ? '#FFF' : tColors.primary} />
        </View>
      </View>
      {expanded && (
        <View style={[s.answerWrap, { borderTopColor: isDarkMode ? '#333' : '#F1F5F9' }]}>
          <Text style={[s.answer, { color: tColors.textGray }]}>{item.a}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function StudentHelpSupport() {
  const router = useRouter();
  const { theme: tColors, isDarkMode } = useApp();
  const [search, setSearch] = useState('');

  const filteredFaqs = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(i => 
      i.q.toLowerCase().includes(search.toLowerCase()) || 
      i.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <View style={[s.container, { backgroundColor: tColors.bg }]}>
      {/* Premium Header */}
      <LinearGradient
        colors={isDarkMode ? ['#1A2F25', '#121212'] : ['#E8F5E9', '#FDFDFD']}
        style={s.topBanner}
      >
        <View style={s.headerRow}>
          <TouchableOpacity style={[s.backBtn, { backgroundColor: tColors.cardBg, borderColor: tColors.border }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={tColors.textDark} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: tColors.textDark }]}>Help Center</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={s.bannerTextWrap}>
          <Text style={[s.bannerTitle, { color: tColors.textDark }]}>How can we help you?</Text>
          <Text style={[s.bannerSub, { color: tColors.textGray }]}>Find answers to your questions or get in touch.</Text>
        </View>

        <View style={[s.searchBar, { backgroundColor: tColors.cardBg, borderColor: tColors.border }]}>
          <Ionicons name="search" size={18} color={tColors.primary} />
          <TextInput 
            style={[s.searchInput, { color: tColors.textDark }]} 
            placeholder="Search topics, questions..." 
            placeholderTextColor={tColors.textGray}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {!search && (
          <>
            <Text style={[s.sectionLabel, { color: tColors.textGray }]}>Direct Contact</Text>
            <View style={s.contactRow}>
              <TouchableOpacity 
                style={s.contactCard} 
                onPress={() => Linking.openURL('mailto:princebana499@gmail.com')}
                activeOpacity={0.7}
              >
                <View style={[s.contactIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="mail" size={20} color="#4F46E5" />
                </View>
                <Text style={[s.contactText, { color: tColors.textDark }]}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={s.contactCard} 
                onPress={() => Linking.openURL('tel:+919636973572')}
                activeOpacity={0.7}
              >
                <View style={[s.contactIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="call" size={20} color="#16A34A" />
                </View>
                <Text style={[s.contactText, { color: tColors.textDark }]}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={s.contactCard} 
                onPress={() => Linking.openURL('https://wa.me/919636973572')}
                activeOpacity={0.7}
              >
                <View style={[s.contactIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                </View>
                <Text style={[s.contactText, { color: tColors.textDark }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[s.sectionLabel, { color: tColors.textGray }]}>Common Questions</Text>
          </>
        )}

        {filteredFaqs.map((cat, idx) => (
          <View key={idx} style={s.categorySection}>
            <View style={s.catHeader}>
              <View style={[s.catIconBox, { backgroundColor: tColors.primaryLight }]}>
                <Ionicons name={cat.icon} size={16} color={tColors.primary} />
              </View>
              <Text style={[s.catTitle, { color: tColors.textDark }]}>{cat.category}</Text>
            </View>
            {cat.items.map((item, i) => (
              <FAQItem key={i} item={item} tColors={tColors} isDarkMode={isDarkMode} />
            ))}
          </View>
        ))}

        {filteredFaqs.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={60} color={tColors.border} />
            <Text style={[s.emptyTitle, { color: tColors.textDark }]}>No results found</Text>
            <Text style={[s.emptyText, { color: tColors.textGray }]}>Humne search kiya par kuch nahi mila. Dusra keyword try karein.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBanner: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  
  bannerTextWrap: { marginBottom: 24 },
  bannerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  bannerSub: { fontSize: 14, marginTop: 4, fontWeight: '500' },

  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' },

  scrollContent: { paddingTop: 24, paddingBottom: 60 },
  
  sectionLabel: { fontSize: 13, fontWeight: '800', marginLeft: 24, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 },
  contactRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 35 },
  contactCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 20, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  contactIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  contactText: { fontSize: 13, fontWeight: '700' },

  categorySection: { marginBottom: 20 },
  catHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  catIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  catTitle: { fontSize: 18, fontWeight: '800' },
  
  faqCard: { marginHorizontal: 24, borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 15, fontWeight: '700', flex: 1, lineHeight: 22, paddingRight: 15 },
  arrowCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  answerWrap: { marginTop: 15, paddingTop: 15, borderTopWidth: 1 },
  answer: { fontSize: 14, lineHeight: 24, fontWeight: '500' },

  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});
