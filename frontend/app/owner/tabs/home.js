import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, TextInput } from 'react-native';
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

export default function OwnerHome() {
  const router = useRouter();
  const { ownerData, libraries, pendingBookings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const goDetail = (id) => router.push({ pathname: '/student/library-detail', params: { id } });

  // Filter libraries based on search query
  const filteredLibraries = (libraries || []).filter(lib => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (lib.name && lib.name.toLowerCase().includes(q)) ||
      (lib.address && lib.address.toLowerCase().includes(q)) ||
      (lib.city && lib.city.toLowerCase().includes(q)) ||
      (lib.area && lib.area.toLowerCase().includes(q))
    );
  });

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.hello}>Hello, {ownerData?.name || 'Aryan'}</Text>
            <Text style={s.title}>Find your</Text>
            <Text style={s.title}>study space</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.bellBtn} onPress={() => router.push('/owner/notifications')} activeOpacity={0.8}>
              <Ionicons name="notifications" size={20} color="#FFF" />
              {pendingBookings?.length > 0 && (
                <View style={s.bellBadge}>
                  <Text style={s.bellBadgeText}>{pendingBookings?.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={s.locationBadge}>
              <Ionicons name="location" size={12} color={tColors.primary} />
              <Text style={s.locText}>Jaipur</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchBar}>
          <Ionicons name="search" size={20} color={tColors.textGray} />
          <TextInput 
            style={s.searchInput}
            placeholder="Library name ya area..."
            placeholderTextColor={tColors.textGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={tColors.textGray} />
            </TouchableOpacity>
          )}
        </View>

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

        {/* No Results Fallback */}
        {filteredLibraries.length === 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="search-outline" size={40} color={tColors.textGray} />
            <Text style={{ marginTop: 10, color: tColors.textGray, fontSize: 16 }}>Koi library nahi mili.</Text>
          </View>
        )}

        {/* Cards */}
        {filteredLibraries.slice(0, 10).map((lib, i) => {
          const distance = (1.2 + i * 0.8).toFixed(1);
          return (
          <TouchableOpacity key={lib.id || lib._id || i} style={s.card} activeOpacity={0.9} onPress={() => goDetail(lib.id || lib._id)}>
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
                <Text style={s.locationText} numberOfLines={1}>{lib.address || lib.area} • {distance} km</Text>
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
                  <Text style={s.reviewsText}>{(lib.rating * 28 || 120).toFixed(0)} reviews</Text>
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
  bellBadge: { 
    position: 'absolute', 
    top: -2, 
    right: -2, 
    backgroundColor: '#EF4444', 
    minWidth: 16, 
    height: 16, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: tColors.bg,
    paddingHorizontal: 2
  },
  bellBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: tColors.border, marginBottom: 24 },
  searchInput: { flex: 1, fontSize: 15, color: tColors.textDark, marginLeft: 10, outlineStyle: 'none' },

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
