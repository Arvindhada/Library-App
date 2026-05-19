import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';

export default function StudentHome() {
  const router = useRouter();
  const { studentData, libraries, currentBookings, fetchStudentBookings, fetchLibraries, loading, theme: tColors } = useApp();
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    fetchLibraries();
    fetchStudentBookings();
  }, []);

  const activeBooking = useMemo(() => 
    currentBookings.find(b => b.status === 'Active' || b.status === 'Pending'),
  [currentBookings]);

  const goDetail = (id) => router.push({ pathname: '/student/library-detail', params: { id } });

  const filteredLibraries = useMemo(() => {
    if (!searchQuery) return libraries;
    const q = searchQuery.toLowerCase();
    return libraries.filter(lib => 
      lib.name?.toLowerCase().includes(q) || 
      lib.area?.toLowerCase().includes(q) ||
      lib.address?.toLowerCase().includes(q)
    );
  }, [libraries, searchQuery]);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    headerLeft: { flex: 1 },
    hello: { fontSize: 14, color: tColors.textGray, marginBottom: 8, fontWeight: '500' },
    title: { fontSize: 32, fontWeight: '700', color: tColors.textDark, lineHeight: 38 },
    headerRight: { alignItems: 'flex-end', paddingTop: 4 },
    bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: tColors.textDark, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.cardBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: tColors.border },
    locText: { fontSize: 12, fontWeight: '600', color: tColors.textDark, marginLeft: 4 },
    
    // Active Booking Card
    activeCard: { backgroundColor: tColors.primary, borderRadius: 24, padding: 20, marginBottom: 24, elevation: 4 },
    activeTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    activeLib: { color: '#FFF', fontSize: 20, fontWeight: '800' },
    activeMeta: { color: '#FFF', fontSize: 14, marginTop: 4, opacity: 0.9 },
    activeStatus: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 12 },
    activeStatusTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },

    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.cardBg, paddingHorizontal: 16, paddingVertical: 2, borderRadius: 24, borderWidth: 1, borderColor: tColors.border, marginBottom: 24 },
    searchInput: { flex: 1, fontSize: 15, color: tColors.textDark, marginLeft: 10, paddingVertical: 12 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingHorizontal: 10 },
    statBox: { alignItems: 'center' },
    statVal: { fontSize: 22, fontWeight: '700', color: tColors.textDark },
    statLabel: { fontSize: 12, color: tColors.textGray, marginTop: 4 },
    statDivider: { width: 1, height: 24, backgroundColor: tColors.border },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    secTitle: { fontSize: 18, fontWeight: '700', color: tColors.textDark },
    seeAll: { fontSize: 14, fontWeight: '600', color: tColors.primary },

    card: { backgroundColor: tColors.cardBg, borderRadius: 24, padding: 8, marginBottom: 16, borderWidth: 1, borderColor: tColors.border },
    cardImgArea: { height: 160, padding: 12, justifyContent: 'space-between' },
    imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16 },
    seatsBadge: { alignSelf: 'flex-end', backgroundColor: tColors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, zIndex: 2 },
    seatsBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
    featureBadge: { backgroundColor: tColors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    featureBadgeText: { color: tColors.primary, fontSize: 11, fontWeight: '700' },

    cardDetails: { padding: 12, paddingTop: 16 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    libName: { fontSize: 17, fontWeight: '700', color: tColors.textDark, flex: 1 },
    priceBox: { alignItems: 'flex-end' },
    priceVal: { fontSize: 16, fontWeight: '700', color: tColors.textDark },
    priceLabel: { fontSize: 11, color: tColors.textGray },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    locationText: { fontSize: 13, color: tColors.textGray, marginLeft: 4, flex: 1 },
    
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ratingBox: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 14, fontWeight: '700', color: tColors.textDark, marginLeft: 4 },
    reviewsText: { fontSize: 13, color: tColors.textGray, marginLeft: 6 },
    bookBtn: { backgroundColor: tColors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    bookBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  });

  return (
    <View style={s.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { fetchLibraries(); fetchStudentBookings(); }} tintColor={tColors.primary} />}
      >
        
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.hello}>Hello, {studentData?.name?.split(' ')[0] || 'Aryan'}</Text>
            <Text style={s.title}>Find your</Text>
            <Text style={s.title}>study space</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.bellBtn} onPress={() => router.push('/student/tabs/profile')}>
              <Ionicons name="person" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={s.locationBadge}>
              <Ionicons name="location" size={12} color={tColors.primary} />
              <Text style={s.locText}>Jaipur</Text>
            </View>
          </View>
        </View>

        {/* ACTIVE BOOKING CARD */}
        {activeBooking && (
          <TouchableOpacity 
            style={[s.activeCard, activeBooking.status === 'Pending' && { backgroundColor: '#F59E0B' }]} 
            activeOpacity={0.9}
            onPress={() => goDetail(activeBooking.library?._id || activeBooking.library)}
          >
            <Text style={s.activeTitle}>{activeBooking.status === 'Active' ? 'CURRENTLY STUDYING AT' : 'WAITING FOR APPROVAL'}</Text>
            <Text style={s.activeLib}>{activeBooking.library?.name || 'Your Library'}</Text>
            <Text style={s.activeMeta}>Seat {activeBooking.seat} • {activeBooking.shift}</Text>
            <View style={s.activeStatus}>
              <Text style={s.activeStatusTxt}>
                {activeBooking.status === 'Active' 
                  ? `Expires: ${new Date(activeBooking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                  : 'Pending Owner Approval'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Search */}
        <View style={s.searchBar}>
          <Ionicons name="search" size={20} color={tColors.textGray} />
          <React.Fragment>
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
          </React.Fragment>
        </View>

        {/* Section Title */}
        <View style={s.sectionHeader}>
          <Text style={s.secTitle}>{searchQuery ? 'Search Results' : 'Libraries Near You'}</Text>
          {!searchQuery && <TouchableOpacity><Text style={s.seeAll}>See all</Text></TouchableOpacity>}
        </View>

        {/* Cards */}
        {filteredLibraries.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="search-outline" size={48} color={tColors.border} />
            <Text style={{ color: tColors.textGray, marginTop: 10 }}>Koi library nahi mili.</Text>
          </View>
        ) : (filteredLibraries.map((lib, i) => {
          const distance = (1.2 + i * 0.8).toFixed(1);
          return (
          <TouchableOpacity key={lib._id || lib.id} style={s.card} activeOpacity={0.9} onPress={() => goDetail(lib._id || lib.id)}>
            <ImageBackground source={{ uri: lib.photos?.[0] || 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80' }} style={s.cardImgArea} imageStyle={{ borderRadius: 16 }}>
              <View style={s.imageOverlay} />
              <View style={[s.seatsBadge, { backgroundColor: lib.vacantSeats > 0 ? tColors.primary : '#EF4444' }]}>
                <Text style={s.seatsBadgeText}>{lib.vacantSeats > 0 ? `${lib.vacantSeats} seats free` : 'Full'}</Text>
              </View>
            </ImageBackground>

            <View style={s.cardDetails}>
              <View style={s.cardRow}>
                <Text style={s.libName} numberOfLines={1}>{lib.name}</Text>
                <View style={s.priceBox}>
                  <Text style={s.priceVal}>₹{lib.full_time_fee || lib.fullTime?.fee || 1000}</Text>
                  <Text style={s.priceLabel}>/month</Text>
                </View>
              </View>

              <View style={s.locationRow}>
                <Ionicons name="location-outline" size={14} color={tColors.textGray} />
                <Text style={s.locationText} numberOfLines={1}>{lib.address} • {distance} km</Text>
              </View>

              <View style={s.featuresRow}>
                {lib.facilities?.slice(0, 8).map((f, idx) => (
                  <View key={idx} style={s.featureBadge}>
                    <Text style={s.featureBadgeText}>{f.toUpperCase()}</Text>
                  </View>
                ))}
                {lib.facilities?.length > 8 && (
                  <View style={s.featureBadge}>
                    <Text style={s.featureBadgeText}>+{lib.facilities.length - 8} MORE</Text>
                  </View>
                )}
              </View>

              <View style={s.cardBottomRow}>
                <View style={s.ratingBox}>
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={s.ratingText}>{lib.rating || 4.5}</Text>
                  <Text style={s.reviewsText}>{(lib.rating || 4.5 * 28).toFixed(0)} reviews</Text>
                </View>
                <TouchableOpacity style={s.bookBtn} onPress={() => goDetail(lib._id || lib.id)}>
                  <Text style={s.bookBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}


