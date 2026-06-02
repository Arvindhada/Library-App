import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';

// Local theme for the new design
const tColors = {
  primary: '#1D7151',      // Deep green
  primaryLight: '#E8F5E9', // Light green bg for badges
  textDark: '#1A1D1E',
  textGray: '#707375',
  bg: '#FDFDFD',
  cardBg: '#FFFFFF',
  border: '#EAEAEA',
  badgeBg: 'rgba(0,0,0,0.3)',
};

// We will map over the 'libraries' from context instead of DUMMY_LIBS.

export default function OwnerHome() {
  const router = useRouter();
  const { ownerData, libraries, currentLibrary } = useApp();

  const goDetail = (id) => router.push({ pathname: '/student/library-detail', params: { id } });

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.hello}>Hello, {ownerData?.name || 'Aryan'}</Text>
            <Text style={s.title}>Find your</Text>
            <Text style={s.title}>study space</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.bellBtn}>
              <Ionicons name="notifications" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={s.locationBadge}>
              <Ionicons name="location" size={12} color={tColors.primary} />
              <Text style={s.locText}>Jaipur</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <TouchableOpacity style={s.searchBar} activeOpacity={0.9}>
          <Ionicons name="search" size={20} color={tColors.textGray} />
          <Text style={s.searchPlaceholder}>Library name ya area...</Text>
        </TouchableOpacity>

        {/* Add Library Banner */}
        {!currentLibrary && (
          <View style={s.bannerCard}>
            <View style={s.bannerContent}>
              <Text style={s.bannerTitle}>List Your Library on LibConnect</Text>
              <Text style={s.bannerSub}>Register your study space today to manage students, seats, and collect fees digitally!</Text>
              <TouchableOpacity 
                style={s.bannerBtn} 
                onPress={() => router.push('/owner/add-library')}
                activeOpacity={0.8}
              >
                <Text style={s.bannerBtnText}>+ Add Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statVal}>47</Text>
            <Text style={s.statLabel}>Libraries</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statVal}>312</Text>
            <Text style={s.statLabel}>Seats free</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statVal}>₹300</Text>
            <Text style={s.statLabel}>Min/day</Text>
          </View>
        </View>

        {/* Section Title */}
        <View style={s.sectionHeader}>
          <Text style={s.secTitle}>Libraries Near You</Text>
          <TouchableOpacity><Text style={s.seeAll}>See all</Text></TouchableOpacity>
        </View>

        {/* Cards */}
        {libraries.slice(0, 5).map((lib, i) => {
          const distance = (1.2 + i * 0.8).toFixed(1);
          return (
          <TouchableOpacity key={lib.id} style={s.card} activeOpacity={0.9} onPress={() => goDetail(lib.id)}>
            {/* Image Area placeholder */}
            <ImageBackground source={{ uri: lib.photos?.[0] || 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80' }} style={s.cardImgArea} imageStyle={{ borderRadius: 16 }}>
              {/* Overlay for better text readability */}
              <View style={s.imageOverlay} />
              
              {/* Top right seats badge */}
              <View style={[s.seatsBadge, { backgroundColor: lib.vacantSeats > 0 ? tColors.primary : '#EF4444' }]}>
                <Text style={s.seatsBadgeText}>{lib.vacantSeats > 0 ? `${lib.vacantSeats} seats free` : 'Full'}</Text>
              </View>

            </ImageBackground>

            {/* Details Area */}
            <View style={s.cardDetails}>
              <View style={s.cardRow}>
                <Text style={s.libName} numberOfLines={1}>{lib.name}</Text>
                <View style={s.priceBox}>
                  <Text style={s.priceVal}>₹{lib.halfTime?.fee || 400}</Text>
                  <Text style={s.priceLabel}>/month</Text>
                </View>
              </View>

              <View style={s.locationRow}>
                <Ionicons name="location-outline" size={14} color={tColors.textGray} />
                <Text style={s.locationText} numberOfLines={1}>{lib.address} • {distance} km</Text>
              </View>

              {/* Feature badges moved below */}
              <View style={s.featuresRow}>
                {lib.isOpen24hrs && (
                  <View style={s.featureBadge}>
                    <Text style={s.featureBadgeText}>24hr</Text>
                  </View>
                )}
                {lib.facilities?.slice(0, 3).map((f, idx) => (
                  <View key={idx} style={s.featureBadge}>
                    <Text style={s.featureBadgeText}>{f.toUpperCase()}</Text>
                  </View>
                ))}
              </View>

              <View style={s.cardBottomRow}>
                <View style={s.ratingBox}>
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={s.ratingText}>{lib.rating || 4.5}</Text>
                  <Text style={s.reviewsText}>{(lib.rating * 28).toFixed(0)} reviews</Text>
                </View>
                <TouchableOpacity style={s.bookBtn}>
                  <Text style={s.bookBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )})}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: tColors.bg },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  headerLeft: { flex: 1 },
  hello: { fontSize: 14, color: tColors.textGray, marginBottom: 8, fontWeight: '500' },
  title: { fontSize: 32, fontWeight: '700', color: tColors.textDark, lineHeight: 38 },
  headerRight: { alignItems: 'flex-end', paddingTop: 4 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: tColors.textDark, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: tColors.border },
  locText: { fontSize: 12, fontWeight: '600', color: tColors.textDark, marginLeft: 4 },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: tColors.border, marginBottom: 24 },
  searchPlaceholder: { fontSize: 15, color: tColors.textGray, marginLeft: 10 },

  bannerCard: {
    backgroundColor: '#E8F5E0', // C.primaryLight (soft green)
    borderColor: '#9FE1CB',     // C.primaryBorder
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  bannerContent: {
    gap: 6,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F6E56',           // C.primary (deep green)
  },
  bannerSub: {
    fontSize: 13,
    color: '#6F7A74',           // C.textGray
    lineHeight: 18,
  },
  bannerBtn: {
    backgroundColor: '#0F6E56', // C.primary green
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  bannerBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingHorizontal: 10 },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: tColors.textDark },
  statLabel: { fontSize: 12, color: tColors.textGray, marginTop: 4 },
  statDivider: { width: 1, height: 24, backgroundColor: tColors.border },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  secTitle: { fontSize: 18, fontWeight: '700', color: tColors.textDark },
  seeAll: { fontSize: 14, fontWeight: '600', color: tColors.primary },

  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 8, marginBottom: 16, borderWidth: 1, borderColor: tColors.border },
  cardImgArea: { height: 160, padding: 12, justifyContent: 'space-between' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16 },
  seatsBadge: { alignSelf: 'flex-end', backgroundColor: tColors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, zIndex: 2 },
  seatsBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  featuresRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  featureBadge: { backgroundColor: tColors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  featureBadgeText: { color: tColors.primary, fontSize: 11, fontWeight: '700' },

  cardDetails: { padding: 12, paddingTop: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  libName: { fontSize: 17, fontWeight: '700', color: tColors.textDark, flex: 1 },
  priceBox: { alignItems: 'flex-end' },
  priceVal: { fontSize: 16, fontWeight: '700', color: tColors.textDark },
  priceLabel: { fontSize: 11, color: tColors.textGray },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationText: { fontSize: 13, color: '#4A4D4F', marginLeft: 4, flex: 1 },
  
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBox: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 14, fontWeight: '700', color: tColors.textDark, marginLeft: 4 },
  reviewsText: { fontSize: 13, color: tColors.textGray, marginLeft: 6 },
  bookBtn: { backgroundColor: tColors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  bookBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
