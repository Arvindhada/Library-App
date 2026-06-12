import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';

const { width } = Dimensions.get('window');
const CARD_IMAGE_WIDTH = width - 56;

// We will map over the 'libraries' from context instead of DUMMY_LIBS.

export default function StudentHome() {
  const router = useRouter();
  const { studentData, libraries, theme: tColors } = useApp();

  const goDetail = (id) => router.push({ pathname: '/student/library-detail', params: { id } });

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    headerLeft: { flex: 1 },
    hello: { fontSize: 14, color: tColors.textGray, marginBottom: 8, fontWeight: '500' },
    title: { fontSize: 32, fontWeight: '700', color: tColors.textDark, lineHeight: 38 },
    headerRight: { alignItems: 'flex-end', paddingTop: 4 },
    bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: tColors.textDark, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.cardBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: tColors.border },
    locText: { fontSize: 12, fontWeight: '600', color: tColors.textDark, marginLeft: 4 },
    
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.cardBg, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: tColors.border, marginBottom: 24 },
    searchPlaceholder: { fontSize: 15, color: tColors.textGray, marginLeft: 10 },

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.hello}>Hello, {studentData?.name || 'Aryan'}</Text>
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
        <TouchableOpacity style={s.searchBar} onPress={() => router.push('/student/tabs/search')} activeOpacity={0.9}>
          <Ionicons name="search" size={20} color={tColors.textGray} />
          <Text style={s.searchPlaceholder}>Library name ya area...</Text>
        </TouchableOpacity>

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
          <View key={lib._id || lib.id} style={s.card}>
            <View style={{ height: 160, position: 'relative' }}>
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                style={{ height: 160, borderRadius: 16 }}
              >
                {(lib.photos && lib.photos.length > 0 ? lib.photos : ['https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80']).map((photoUri, index) => (
                  <TouchableOpacity 
                    key={index} 
                    activeOpacity={0.9} 
                    onPress={() => goDetail(lib._id || lib.id)}
                    style={{ width: CARD_IMAGE_WIDTH, height: 160 }}
                  >
                    <ImageBackground source={{ uri: photoUri }} style={s.cardImgArea} imageStyle={{ borderRadius: 16 }}>
                      <View style={s.imageOverlay} />
                      <View style={[s.seatsBadge, { backgroundColor: lib.vacantSeats > 0 ? tColors.primary : '#EF4444' }]}>
                        <Text style={s.seatsBadgeText}>{lib.vacantSeats > 0 ? `${lib.vacantSeats} seats free` : 'Full'}</Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Dots indicator for multiple photos */}
              {lib.photos && lib.photos.length > 1 && (
                <View style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  {lib.photos.map((_, idx) => (
                    <View 
                      key={idx}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        marginHorizontal: 3
                      }}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Details Area */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => goDetail(lib._id || lib.id)} style={s.cardDetails}>
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
            </TouchableOpacity>
          </View>
        )})}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}


