import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../src/services/apiConfig';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';

const DUMMY_NOTIFICATIONS = [
  {
    id: '1',
    title: 'New Booking Request',
    message: 'Rahul Sharma has requested a Morning shift seat.',
    time: '2 mins ago',
    type: 'booking',
    read: false,
  },
  {
    id: '2',
    title: 'Payment Received',
    message: 'Received ₹800 from Amit Kumar via UPI.',
    time: '1 hour ago',
    type: 'payment',
    read: true,
  },
  {
    id: '4',
    title: 'Seat Expiring Soon',
    message: 'Neha Singh\'s seat subscription expires in 2 days.',
    time: '2 days ago',
    type: 'alert',
    read: true,
  }
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { pendingBookings, setPendingBookings, fetchDashboardData } = useApp();

  // Combine real pending bookings with dummy notifications
  const bookingNotifications = (pendingBookings || []).map(req => ({
    id: `req_${req._id}`,
    title: 'New Booking Request',
    message: `${req.student?.name || 'A student'} wants to join ${req.shift} shift (Seat ${req.seat}).`,
    time: 'Just now',
    type: 'booking',
    read: false,
    reqData: req
  }));

  const allNotifications = [...bookingNotifications, ...DUMMY_NOTIFICATIONS];

  const handleMarkAllRead = () => {
    // Logic to mark all as read or clear count
    // For now, just a visual feedback or console log
    console.log('Marking all as read');
  };

  const getIconData = (type) => {
    switch(type) {
      case 'booking': return { name: 'calendar', color: '#3B82F6', bg: '#EFF6FF' };
      case 'payment': return { name: 'cash', color: '#10B981', bg: '#D1FAE5' };
      case 'system': return { name: 'information-circle', color: '#8B5CF6', bg: '#EDE9FE' };
      case 'alert': return { name: 'warning', color: '#F59E0B', bg: '#FEF3C7' };
      default: return { name: 'notifications', color: colors.primary, bg: colors.primaryLight };
    }
  };

  const handleAccept = async (req) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_ENDPOINTS.BOOKINGS}/${req._id}/status`, { status: 'Active' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboardData();
      Alert.alert('✅ Accepted!', `${req.student?.name} has been added to your library.`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept request');
    }
  };

  const renderItem = ({ item }) => {
    const icon = getIconData(item.type);
    const isBooking = item.type === 'booking' && item.reqData;
    
    return (
      <View style={[s.notificationCard, !item.read && s.unreadCard]}>
        <View style={{ flexDirection: 'row' }}>
          <View style={[s.iconWrap, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name} size={20} color={icon.color} />
          </View>
          <View style={s.contentWrap}>
            <View style={s.titleRow}>
              <Text style={[s.title, !item.read && s.unreadText]}>{item.title}</Text>
              <Text style={s.time}>{item.time}</Text>
            </View>
            <Text style={s.message} numberOfLines={2}>{item.message}</Text>
            
            {isBooking && (
              <View style={s.actionRow}>
                <TouchableOpacity 
                  style={s.acceptBtn} 
                  onPress={() => handleAccept(item.reqData)}
                >
                  <Text style={s.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rejectBtn}>
                  <Text style={s.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        {!item.read && <View style={s.unreadDot} />}
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <TouchableOpacity>
          <Text style={s.markAllRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={allNotifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
            <Text style={s.emptyTitle}>No Notifications Yet</Text>
            <Text style={s.emptySub}>When you get notifications, they'll show up here.</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingTop: 52, 
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  markAllRead: { fontSize: 13, fontWeight: '600', color: colors.primary },
  
  listContainer: { padding: 16 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  unreadText: {
    color: '#111827',
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rejectBtnText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
});
