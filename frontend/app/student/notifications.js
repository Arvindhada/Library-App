import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';

const DUMMY_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Booking Accepted',
    message: 'Your booking for The Study Point Library has been accepted by the owner.',
    time: '5 mins ago',
    type: 'success',
    read: false,
  },
  {
    id: '2',
    title: 'Payment Successful',
    message: 'Your payment of ₹800 was processed successfully.',
    time: '2 hours ago',
    type: 'payment',
    read: true,
  },
  {
    id: '3',
    title: 'Seat Expiring',
    message: 'Your seat subscription will expire in 3 days. Renew now to keep your seat.',
    time: '1 day ago',
    type: 'alert',
    read: true,
  }
];

export default function StudentNotifications() {
  const router = useRouter();
  const { theme: tColors } = useApp();

  const getIconData = (type) => {
    switch(type) {
      case 'success': return { name: 'checkmark-circle', color: '#10B981', bg: '#D1FAE5' };
      case 'payment': return { name: 'cash', color: '#3B82F6', bg: '#EFF6FF' };
      case 'alert': return { name: 'warning', color: '#F59E0B', bg: '#FEF3C7' };
      default: return { name: 'notifications', color: tColors.primary, bg: tColors.primaryLight };
    }
  };

  const renderItem = ({ item }) => {
    const icon = getIconData(item.type);
    return (
      <View style={[s.notificationCard, !item.read && s.unreadCard, { borderColor: tColors.border, backgroundColor: tColors.cardBg }]}>
        <View style={[s.iconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={s.contentWrap}>
          <View style={s.titleRow}>
            <Text style={[s.title, { color: tColors.textDark }, !item.read && s.unreadText]}>{item.title}</Text>
            <Text style={[s.time, { color: tColors.textGray }]}>{item.time}</Text>
          </View>
          <Text style={[s.message, { color: tColors.textGray }]} numberOfLines={2}>{item.message}</Text>
        </View>
        {!item.read && <View style={s.unreadDot} />}
      </View>
    );
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: tColors.cardBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: tColors.border },
    headerTitle: { fontSize: 20, fontWeight: '700', color: tColors.textDark },
    markRead: { fontSize: 13, fontWeight: '600', color: tColors.primary },
    
    listContainer: { padding: 20 },
    notificationCard: { flexDirection: 'row', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, position: 'relative' },
    unreadCard: { backgroundColor: tColors.primaryLight + '40', borderColor: tColors.primary + '40' },
    iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    contentWrap: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 15, fontWeight: '600' },
    unreadText: { fontWeight: '800' },
    time: { fontSize: 12 },
    message: { fontSize: 13, lineHeight: 18 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tColors.primary, position: 'absolute', top: 16, right: 16 },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: tColors.textDark, marginTop: 16, marginBottom: 8 },
    emptySub: { fontSize: 14, color: tColors.textGray, textAlign: 'center', paddingHorizontal: 40 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={tColors.textDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <TouchableOpacity><Text style={s.markRead}>Clear</Text></TouchableOpacity>
      </View>

      <FlatList
        data={DUMMY_NOTIFICATIONS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color={tColors.border} />
            <Text style={s.emptyTitle}>No Notifications</Text>
            <Text style={s.emptySub}>Sab kuch up-to-date hai!</Text>
          </View>
        }
      />
    </View>
  );
}
