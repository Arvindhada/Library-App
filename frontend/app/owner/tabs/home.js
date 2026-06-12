import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ImageBackground, Modal, ActivityIndicator, Alert, TextInput, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useApp } from '../../../src/context/AppContext';
import { API_ENDPOINTS } from '../../../src/services/apiConfig';

const { width } = Dimensions.get('window');
const CARD_IMAGE_WIDTH = width - 56;

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
  const { ownerData, libraries, currentLibrary, fetchDashboardData, currentBookings, setCurrentBookings } = useApp();
  
  // Compute real stats from libraries
  const totalLibraries = libraries.length;
  const totalFreeSeats = libraries.reduce((a, l) => a + (l.available_seats || l.vacantSeats || 0), 0);
  const minFee = libraries.length > 0
    ? Math.min(...libraries.map(l => l.halfTime?.fee || l.half_time_fee || 0).filter(f => f > 0))
    : 0;
  
  // Notification states moved from dashboard
  const [notifModal, setNotifModal] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadReq, setLoadReq] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (fetchDashboardData) fetchDashboardData();
    fetchJoinRequests();
  }, []);

  const fetchJoinRequests = async () => {
    setLoadReq(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_ENDPOINTS.BOOKINGS}?status=Requested`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJoinRequests(res.data?.bookings || res.data || []);
    } catch {
      // Offline fallback: set empty array (no dummy data)
      setJoinRequests([]);
    } finally {
      setLoadReq(false);
    }
  };

  const handleAccept = async (req) => {
    setActionId(req._id);
    
    // Default: Start with a 2-day Demo (Unpaid / Pending status)
    const d = new Date();
    d.setDate(d.getDate() + 2); // 2 Days Demo limit
    
    const newStudentBooking = {
      _id: req._id || 'local-req-' + Date.now(),
      student: { 
        name: req.student?.name || 'Student', 
        phone: req.student?.phone || '' 
      },
      seat: req.seat || 'N/A',
      shift: req.shift || 'Full Time',
      status: 'Pending', // 'Pending' means Demo/Fee Due
      endDate: d.toISOString(),
      gender: req.student?.gender || 'Male',
      address: req.student?.address || 'Jaipur',
      admissionDate: new Date().toISOString().split('T')[0],
      fee: req.fee || (req.shift === 'Half Time' ? (currentLibrary?.halfTime?.fee || 600) : (currentLibrary?.fullTime?.fee || 1000))
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_ENDPOINTS.BOOKINGS}/${req._id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 5000
      });
      
      // Add to global current bookings
      setCurrentBookings(prev => [...prev, newStudentBooking]);
      setJoinRequests(prev => prev.filter(r => r._id !== req._id));
      if (fetchDashboardData) fetchDashboardData();
      Alert.alert('Accepted ✅', `${req.student?.name || 'Student'} has been added as a 2-Day Demo. Collect fee to activate.`);
    } catch {
      // Offline/Demo fallback
      setCurrentBookings(prev => [...prev, newStudentBooking]);
      setJoinRequests(prev => prev.filter(r => r._id !== req._id));
      Alert.alert('Done (Demo) ✅', `${req.student?.name || 'Student'} has been added as a 2-Day Demo. Collect fee to activate.`);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = (req) => {
    Alert.alert('Reject Request', `Reject booking request from ${req.student?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(`${API_ENDPOINTS.BOOKINGS}/${req._id}/reject`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch {}
          setJoinRequests(prev => prev.filter(r => r._id !== req._id));
        }
      }
    ]);
  };

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
            <TouchableOpacity 
              style={s.bellBtn} 
              onPress={() => { setNotifModal(true); fetchJoinRequests(); }}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications" size={20} color="#FFF" />
              {joinRequests.length > 0 && (
                <View style={s.bellDot}>
                  <Text style={s.bellDotText}>
                    {joinRequests.length > 9 ? '9+' : joinRequests.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={s.locationBadge}>
              <Ionicons name="location" size={12} color={tColors.primary} />
              <Text style={s.locText}>India</Text>
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
            autoCapitalize="none"
          />
        </View>

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
            <Text style={s.statVal}>{totalLibraries}</Text>
            <Text style={s.statLabel}>Libraries</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statVal}>{totalFreeSeats}</Text>
            <Text style={s.statLabel}>Seats free</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statVal}>{minFee > 0 ? `₹${minFee}` : '--'}</Text>
            <Text style={s.statLabel}>Min/month</Text>
          </View>
        </View>

        {/* Section Title */}
        <View style={s.sectionHeader}>
          <Text style={s.secTitle}>Libraries Near You</Text>
          <TouchableOpacity><Text style={s.seeAll}>See all</Text></TouchableOpacity>
        </View>

        {/* Cards */}
        {libraries
          .filter(lib => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (lib.name && lib.name.toLowerCase().includes(q)) || 
                   (lib.address && lib.address.toLowerCase().includes(q));
          })
          .slice(0, 5).map((lib, i) => {
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
                    style={[s.bookBtn, { backgroundColor: '#1A1D1E' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push('/owner/seat-manager');
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={s.bookBtnText}>Manage →</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── NOTIFICATION MODAL ── */}
      <Modal visible={notifModal} animationType="slide" transparent>
        <View style={s.notifOverlay}>
          <View style={s.notifBox}>
            {/* Header */}
            <View style={s.notifHead}>
              <View>
                <Text style={s.notifTitle}>Notifications</Text>
                <Text style={s.notifSub}>Pending Join Requests</Text>
              </View>
              <TouchableOpacity onPress={() => setNotifModal(false)}>
                <Ionicons name="close" size={24} color={tColors.textGray} />
              </TouchableOpacity>
            </View>

            {loadReq ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator color={tColors.primary} size="large" />
                <Text style={{ color: tColors.textGray, marginTop: 10 }}>Loading requests...</Text>
              </View>
            ) : joinRequests.length === 0 ? (
              <View style={{ padding: 50, alignItems: 'center', gap: 12 }}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#9FE1CB" />
                <Text style={{ color: tColors.textGray, fontSize: 15, fontWeight: '500' }}>
                  No pending requests
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {joinRequests.map(req => {
                  const initials = req.student?.name
                    ? req.student.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'S';
                  return (
                    <View key={req._id} style={s.reqCard}>
                      {req.student?.photo ? (
                        <Image source={{ uri: req.student.photo }} style={s.reqAva} />
                      ) : (
                        <View style={s.reqAvaPlaceholder}>
                          <Text style={s.reqAvaInit}>{initials}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.reqName}>{req.student?.name || 'Student'}</Text>
                        <Text style={s.reqMeta}>📞 {req.student?.phone || 'N/A'}</Text>
                        <Text style={s.reqMeta}>🪑 Seat {req.seat} · {req.shift}</Text>
                      </View>
                      <View style={{ gap: 8 }}>
                        <TouchableOpacity
                          style={s.acceptBtn}
                          onPress={() => handleAccept(req)}
                          disabled={actionId === req._id}
                          activeOpacity={0.85}
                        >
                          {actionId === req._id
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Text style={s.acceptTxt}>Accept</Text>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.rejectBtn}
                          onPress={() => handleReject(req)}
                          activeOpacity={0.8}
                        >
                          <Text style={s.rejectTxt}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: tColors.textDark, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  bellDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#DC2626',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  bellDotText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: tColors.border },
  locText: { fontSize: 12, fontWeight: '600', color: tColors.textDark, marginLeft: 4 },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: tColors.border, marginBottom: 24 },
  searchInput: { flex: 1, fontSize: 15, color: tColors.textDark, marginLeft: 10, padding: 0, minHeight: 24 },

  bannerCard: {
    backgroundColor: '#E8F5E0',
    borderColor: '#9FE1CB',
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
    color: '#0F6E56',
  },
  bannerSub: {
    fontSize: 13,
    color: '#6F7A74',
    lineHeight: 18,
  },
  bannerBtn: {
    backgroundColor: '#0F6E56',
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

  // Notification Modal Styles
  notifOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  notifBox: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: '80%',
  },
  notifHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  notifTitle: { color: tColors.textDark, fontSize: 20, fontWeight: '700' },
  notifSub: { color: tColors.textGray, fontSize: 13, marginTop: 2 },
  
  // Request Card
  reqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F5F3EE', borderRadius: 16, borderWidth: 0.5, borderColor: '#D1CFCA',
    padding: 14, marginBottom: 12,
  },
  reqAva: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: '#9FE1CB' },
  reqAvaPlaceholder: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#E8F5F0', borderWidth: 1.5, borderColor: '#9FE1CB',
    justifyContent: 'center', alignItems: 'center',
  },
  reqAvaInit: { fontSize: 16, fontWeight: '700', color: '#0F6E56' },
  reqName: { color: tColors.textDark, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  reqMeta: { color: tColors.textGray, fontSize: 12, fontWeight: '500', marginBottom: 1 },
  acceptBtn: {
    backgroundColor: '#0F6E56', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 80,
  },
  acceptTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  rejectBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 10, borderWidth: 0.5, borderColor: '#FCA5A5',
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 80,
  },
  rejectTxt: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
});
