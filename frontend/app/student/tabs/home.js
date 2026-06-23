import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Linking, Platform, Alert, RefreshControl, Modal, FlatList } from 'react-native';
import { ImageBackground } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';
import { calculateDistance, formatDistance } from '../../../src/services/distanceHelper';
import { openWhatsApp } from '../../../src/services/whatsapp';

const { width } = Dimensions.get('window');
const CARD_IMAGE_WIDTH = width - 56;

const openDirections = (lat, lng, label) => {
  const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
  const latLng = `${lat},${lng}`;
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`
  });

  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  });
};

const openDirectionsByAddress = (address) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  Linking.openURL(url).catch(() => {
    console.warn("Could not open maps link");
  });
};

// We will map over the 'libraries' from context instead of DUMMY_LIBS.

export default function StudentHome() {
  const router = useRouter();
  const {
    studentData, libraries, theme: tColors, userLocation,
    fetchUserLocation, bookLibrarySpace, fetchLibraries,
    fetchStudentBookings, currentBookings
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  useEffect(() => {
    fetchUserLocation();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchLibraries(), fetchStudentBookings()]).catch(() => { });
    setRefreshing(false);
  }, [fetchLibraries, fetchStudentBookings]);

  useFocusEffect(
    useCallback(() => {
      fetchLibraries().catch(() => { });
      fetchStudentBookings().catch(() => { });
    }, [fetchLibraries, fetchStudentBookings])
  );

  // Derive notifications from active/pending/rejected bookings
  const notifications = useMemo(() => {
    if (!currentBookings || currentBookings.length === 0) return [];

    return currentBookings.map(b => {
      let title = '';
      let body = '';
      let type = ''; // 'pending', 'active', 'rejected'

      const libName = b.library?.name || 'Library';

      if (b.status === 'Pending') {
        title = 'Booking Accepted! 🎉';
        body = `Aapki request ${libName} ke liye accept ho gayi hai (Demo Period). Owner se WhatsApp par contact karke fee pay karein aur seat final karein.`;
        type = 'pending';
      } else if (b.status === 'Active') {
        title = 'Booking Active! 📚';
        body = `Aapki seat ${b.seat || ''} ki booking ${libName} me active hai. Happy studying!`;
        type = 'active';
      } else if (b.status === 'Rejected') {
        title = 'Booking Request Rejected ❌';
        body = `${libName} ke owner ne aapki request reject kar di hai.`;
        type = 'rejected';
      } else {
        return null;
      }

      return {
        id: b._id || b.id,
        title,
        body,
        type,
        library: b.library,
        booking: b
      };
    }).filter(Boolean);
  }, [currentBookings]);

  const unreadCount = notifications.length;

  // Compute dynamic stats
  const totalLibrariesCount = libraries.length;
  const totalFreeSeatsCount = libraries.reduce((sum, l) => sum + (l.vacantSeats || l.available_seats || 0), 0);
  const minMonthlyFee = libraries.length > 0
    ? Math.min(...libraries.map(l => l.halfTime?.fee || l.half_time_fee || 0).filter(f => f > 0))
    : 0;

  // Filter and sort libraries dynamically by distance
  const filteredLibraries = libraries
    .map((lib) => {
      const libLat = lib.coordinates?.lat;
      const libLng = lib.coordinates?.lng;
      const userCoords = userLocation || { latitude: 26.9124, longitude: 75.7873 };

      let distance = null;
      if (libLat !== undefined && libLat !== null && libLng !== undefined && libLng !== null) {
        distance = calculateDistance(userCoords.latitude, userCoords.longitude, libLat, libLng);
      }

      return { ...lib, calculatedDistance: distance };
    })
    .filter(lib => {
      const nameMatch = lib.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const addressMatch = lib.address?.toLowerCase().includes(searchQuery.toLowerCase());
      const facilitiesMatch = lib.facilities?.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return nameMatch || addressMatch || facilitiesMatch;
    })
    .sort((a, b) => {
      if (a.calculatedDistance === null && b.calculatedDistance === null) return 0;
      if (a.calculatedDistance === null) return 1;
      if (b.calculatedDistance === null) return -1;
      return a.calculatedDistance - b.calculatedDistance;
    });

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

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 60 }}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.hello}>Hello, {studentData?.name || 'Student'}</Text>
          <Text style={s.title}>Find your</Text>
          <Text style={s.title}>study space</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.bellBtn} onPress={() => setNotifModalVisible(true)} activeOpacity={0.8}>
            <Ionicons name="notifications" size={20} color="#FFF" />
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: '#EF4444',
                width: 8,
                height: 8,
                borderRadius: 4,
              }} />
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
          style={{ flex: 1, marginLeft: 10, fontSize: 15, color: tColors.textDark, padding: 0 }}
          placeholder="Library name ya area..."
          placeholderTextColor={tColors.textGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Row */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statVal}>{totalLibrariesCount}</Text>
          <Text style={s.statLabel}>Libraries</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBox}>
          <Text style={s.statVal}>{totalFreeSeatsCount}</Text>
          <Text style={s.statLabel}>Seats free</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBox}>
          <Text style={s.statVal}>₹{minMonthlyFee}</Text>
          <Text style={s.statLabel}>Min/month</Text>
        </View>
      </View>

      {/* Section Title */}
      <View style={s.sectionHeader}>
        <Text style={s.secTitle}>Libraries Near You</Text>
        <TouchableOpacity><Text style={s.seeAll}>See all</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderLibrarySkeleton = () => (
    <View style={[s.card, { marginHorizontal: 20 }]}>
      <View style={[s.cardImgArea, { backgroundColor: '#E5E7EB', borderRadius: 16 }]} />
      <View style={s.cardDetails}>
        <View style={{ height: 20, backgroundColor: '#E5E7EB', borderRadius: 4, width: '60%', marginBottom: 8 }} />
        <View style={{ height: 14, backgroundColor: '#E5E7EB', borderRadius: 4, width: '40%', marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ height: 16, backgroundColor: '#E5E7EB', borderRadius: 4, width: '30%' }} />
          <View style={{ height: 36, backgroundColor: '#E5E7EB', borderRadius: 18, width: 80 }} />
        </View>
      </View>
    </View>
  );

  const renderLibraryCard = ({ item: lib }) => {
    const distanceStr = lib.calculatedDistance === null ? 'Unknown' : formatDistance(lib.calculatedDistance);
    return (
      <View style={[s.card, { marginHorizontal: 20 }]}>
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
            <Text style={s.locationText} numberOfLines={1}>{lib.address}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: tColors.primary, marginLeft: 8 }}>{distanceStr}</Text>
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
            <TouchableOpacity
              style={s.bookBtn}
              onPress={async (e) => {
                e.stopPropagation();
                try {
                  await bookLibrarySpace(lib._id || lib.id, 'Full Time');
                  Alert.alert(
                    'Request Sent! 🚀',
                    'Aapki seat booking request database me save ho gayi hai. Chalo ab WhatsApp par owner ko message karke seat final karte hain!',
                    [
                      {
                        text: 'Open WhatsApp',
                        onPress: () => openWhatsApp(lib.whatsapp || lib.phone || '9988378077', lib.name, 'Full Time')
                      }
                    ]
                  );
                } catch (err) {
                  Alert.alert('Error', 'Booking request failed: ' + (err.response?.data?.message || err.message));
                }
              }}
            >
              <Text style={s.bookBtnText}>Book</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <FlatList
        data={libraries.length === 0 ? [1, 2, 3] : filteredLibraries}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        renderItem={libraries.length === 0 ? renderLibrarySkeleton : renderLibraryCard}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={{ height: 40 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tColors.primary]} />
        }
      />

      {/* Notifications Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notifModalVisible}
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: tColors.cardBg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            maxHeight: '80%',
            borderWidth: 1,
            borderColor: tColors.border
          }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: tColors.textDark
              }}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={tColors.textGray} />
              </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="notifications-off-outline" size={48} color={tColors.textGray} style={{ marginBottom: 12 }} />
                  <Text style={{ color: tColors.textGray, fontSize: 15, fontWeight: '500' }}>No new notifications yet.</Text>
                </View>
              ) : (
                notifications.map(notif => (
                  <View
                    key={notif.id}
                    style={{
                      backgroundColor: tColors.bg,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: tColors.border
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons
                        name={notif.type === 'active' ? 'checkmark-circle' : (notif.type === 'rejected' ? 'close-circle' : 'time')}
                        size={20}
                        color={notif.type === 'active' ? '#10B981' : (notif.type === 'rejected' ? '#EF4444' : '#F5A623')}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: tColors.textDark, flex: 1 }}>
                        {notif.title}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: tColors.textGray, lineHeight: 18, marginBottom: 12 }}>
                      {notif.body}
                    </Text>

                    {notif.type === 'pending' && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: tColors.primary,
                          borderRadius: 12,
                          paddingVertical: 10,
                          alignItems: 'center'
                        }}
                        onPress={() => {
                          setNotifModalVisible(false);
                          openWhatsApp(notif.library?.whatsapp || notif.library?.phone || '9988378077', notif.library?.name, `${notif.booking?.shift} (Seat ${notif.booking?.seat})`);
                        }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>Open WhatsApp to Confirm</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


