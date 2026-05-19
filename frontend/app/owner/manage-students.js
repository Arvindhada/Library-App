import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, Modal, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { sendFeeReminder, openWhatsApp } from '../../src/services/whatsapp';
import { ownerAddStudent, updateBookingStatus } from '../../src/services/bookingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../../src/services/apiConfig';

export default function ManageStudents() {
  const router = useRouter();
  const { currentLibrary, currentBookings, fetchDashboardData, loading, theme: tColors } = useApp();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('All'); 

  const [form, setForm] = useState({ name: '', phone: '', seat: '', plan: 'Full Time' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'UPI' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const parsedStudents = useMemo(() => {
    const today = new Date();
    const twoDaysLater = new Date();
    twoDaysLater.setDate(today.getDate() + 2);
    
    return currentBookings.map(b => {
      const expiryDate = new Date(b.endDate);
      const isDue = expiryDate < today;
      const isSoon = !isDue && expiryDate <= twoDaysLater;
      const fee = b.shift === 'Half Time' ? currentLibrary?.halfTime?.fee : currentLibrary?.fullTime?.fee;
      
      return { 
        ...b, 
        name: b.student?.name || 'Unknown', 
        phone: b.student?.phone || 'N/A', 
        expiry: expiryDate.toLocaleDateString(),
        isDue, 
        isSoon, 
        fee 
      };
    });
  }, [currentBookings, currentLibrary]);

  const totalCollected = useMemo(() => 
    parsedStudents.filter(s => s.status === 'Active' && !s.isDue).reduce((acc, s) => acc + (s.fee || 0), 0),
  [parsedStudents]);

  const totalPending = useMemo(() => 
    parsedStudents.filter(s => s.status === 'Active' && s.isDue).reduce((acc, s) => acc + (s.fee || 0), 0),
  [parsedStudents]);

  const filteredStudents = useMemo(() => {
    return parsedStudents.filter(s => {
      if (s.status !== 'Active') return false;
      if (activeTab === 'Paid') return !s.isDue;
      if (activeTab === 'Due') return s.isDue || s.isSoon;
      return true;
    });
  }, [parsedStudents, activeTab]);

  const openForm = () => {
    setForm({ name: '', phone: '', seat: '', plan: 'Full Time' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.seat) {
      Alert.alert('Error', 'Please fill all mandatory fields');
      return;
    }
    if (!currentLibrary) {
      Alert.alert('Error', 'Please register your library first');
      return;
    }

    try {
      await ownerAddStudent({
        name: form.name,
        phone: form.phone,
        seat: form.seat,
        shift: form.plan,
        libraryId: currentLibrary._id
      });
      fetchDashboardData();
      setModalVisible(false);
      Alert.alert('Success', 'Student added successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not add student');
    }
  };

  const confirmDelete = (bookingId) => {
    Alert.alert('Remove Student', 'Are you sure you want to cancel this booking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await updateBookingStatus(bookingId, 'Rejected');
          fetchDashboardData();
        } catch (error) {
          Alert.alert('Error', 'Could not remove student');
        }
      }},
    ]);
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const openPaymentModal = (student) => {
    setSelectedStudent(student);
    setPaymentForm({ amount: String(student.fee || 0), method: 'UPI' });
    setPaymentModalVisible(true);
  };

  const [paymentSaving, setPaymentSaving] = useState(false);

  const handleCollectPayment = async () => {
    if (!paymentForm.amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    setPaymentSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_ENDPOINTS.PAYMENTS}/collect`, {
        bookingId: selectedStudent._id,
        amount: parseInt(paymentForm.amount, 10),
        method: paymentForm.method,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setPaymentModalVisible(false);
      await fetchDashboardData();
      Alert.alert(
        '✅ Payment Recorded!',
        `₹${paymentForm.amount} via ${paymentForm.method} saved.\nBooking extended by 30 days.`
      );
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Could not record payment';
      Alert.alert('❌ Payment Failed', msg);
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleReminder = (st) => {
    sendFeeReminder(st.phone, st.name, st.fee, currentLibrary?.name);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    
    // HEADER
    header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, backgroundColor: tColors.bg },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: tColors.cardBg, borderWidth: 1, borderColor: tColors.border, justifyContent: 'center', alignItems: 'center' },
    heading: { fontSize: 24, fontWeight: '800', color: tColors.textDark, textAlign: 'center' },
    subHeading: { fontSize: 14, color: tColors.textGray, textAlign: 'center', marginTop: 4, fontWeight: '500' },
    addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: tColors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: tColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

    // SUMMARY
    summaryRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 24, gap: 12 },
    summaryCard: { flex: 1, backgroundColor: tColors.cardBg, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: tColors.border },
    sumLbl: { fontSize: 12, color: tColors.textGray, marginBottom: 6, fontWeight: '600' },
    sumVal: { fontSize: 18, fontWeight: '800' },

    // TABS
    tabRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: tColors.cardBg, gap: 6, borderWidth: 1, borderColor: tColors.border },
    tabActive: { backgroundColor: tColors.textDark, borderColor: tColors.textDark },
    tabText: { fontSize: 13, color: tColors.textGray, fontWeight: '700' },
    tabTextActive: { color: tColors.bg },
    tabCount: { backgroundColor: tColors.badgeBg, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    tabCountText: { fontSize: 11, color: tColors.textDark, fontWeight: '800' },

    // STUDENT CARDS
    list: { paddingHorizontal: 20 },
    card: { backgroundColor: tColors.cardBg, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: tColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: tColors.primary, fontWeight: '800', fontSize: 18 },
    stName: { fontSize: 16, fontWeight: '700', color: tColors.textDark },
    stPhone: { fontSize: 13, color: tColors.textGray, marginTop: 4, fontWeight: '500' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
    statusText: { fontSize: 11, fontWeight: '700' },
    
    infoStrip: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    infoChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tColors.badgeBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    infoChipText: { fontSize: 12, color: tColors.textDark, fontWeight: '600' },
    
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    feeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tColors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
    feeText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
    
    remindBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F5E9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#C8E6C9' },
    remindTextSmall: { fontSize: 13, fontWeight: '700', color: '#10B981' },
    
    rightActions: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
    iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: tColors.badgeBg, borderRadius: 12 },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: tColors.textDark, fontWeight: '700', marginTop: 16 },
    emptySubText: { fontSize: 14, color: tColors.textGray, marginTop: 6, textAlign: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: tColors.cardBg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalHandle: { width: 40, height: 5, backgroundColor: tColors.border, borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: tColors.textDark },
    
    inputLabel: { fontSize: 13, color: tColors.textDark, marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: tColors.badgeBg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, fontSize: 15, marginBottom: 20, color: tColors.textDark, fontWeight: '500' },
    
    planRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    pBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: tColors.border, alignItems: 'center', backgroundColor: tColors.cardBg },
    pBtnActive: { borderColor: tColors.primary, backgroundColor: tColors.primaryLight },
    pText: { fontSize: 14, color: tColors.textGray, fontWeight: '600', marginTop: 4 },
    pTextActive: { color: tColors.primary, fontWeight: '700' },
    
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelModal: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: tColors.badgeBg },
    cancelModalText: { fontSize: 15, fontWeight: '700', color: tColors.textDark },
    saveModal: { flex: 2, backgroundColor: tColors.primary, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    saveModalText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

    paymentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, gap: 16 },
    paymentAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: tColors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    paymentAvatarText: { color: tColors.primary, fontSize: 20, fontWeight: '800' },
    paymentStudentName: { fontSize: 15, color: tColors.textGray, marginTop: 4, fontWeight: '500' },
    
    methodRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    methodBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: tColors.border, alignItems: 'center', backgroundColor: tColors.cardBg },
    methodBtnActive: { borderColor: tColors.primary, backgroundColor: tColors.primaryLight },
    methodText: { fontSize: 13, color: tColors.textGray, marginTop: 6, fontWeight: '600' },
    methodTextActive: { color: tColors.primary, fontWeight: '700' },
    
    savePayment: { flex: 2, backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  });

  const renderStudent = ({ item }) => {
    const statusColor = item.isDue ? '#DC2626' : item.isSoon ? '#F59E0B' : '#10B981';
    const statusLabel = item.isDue ? 'Fee Due' : item.isSoon ? 'Expiring Soon' : 'Active';
    const statusIcon = item.isDue ? 'alert-circle' : item.isSoon ? 'time' : 'checkmark-circle';

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={[s.avatar, { backgroundColor: statusColor + '15' }]}>
            <Text style={[s.avatarText, { color: statusColor }]}>{getInitials(item.name)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.stName}>{item.name}</Text>
            <Text style={s.stPhone}>{item.phone}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '10', borderColor: statusColor + '30' }]}>
            <Ionicons name={statusIcon} size={12} color={statusColor} />
            <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={s.infoStrip}>
          <View style={s.infoChip}>
            <Ionicons name="grid-outline" size={14} color={tColors.textGray} />
            <Text style={s.infoChipText}>Seat {item.seat}</Text>
          </View>
          <View style={s.infoChip}>
            <Ionicons name="calendar-outline" size={14} color={tColors.textGray} />
            <Text style={s.infoChipText}>Exp: {item.expiry}</Text>
          </View>
          <View style={[s.infoChip, { backgroundColor: tColors.primaryLight }]}>
            <Text style={[s.infoChipText, { color: tColors.primary }]}>{item.shift}</Text>
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.feeBtn} onPress={() => openPaymentModal(item)}>
            <Ionicons name="cash-outline" size={16} color="#FFF" />
            <Text style={s.feeText}>Collect ₹{item.fee}</Text>
          </TouchableOpacity>
          
          {(item.isDue || item.isSoon) && (
            <TouchableOpacity style={s.remindBtnSmall} onPress={() => handleReminder(item)}>
              <FontAwesome name="whatsapp" size={16} color="#10B981" />
              <Text style={s.remindTextSmall}>Remind</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => openWhatsApp(item.phone, currentLibrary?.name)}>
            <FontAwesome name="whatsapp" size={18} color="#10B981" />
          </TouchableOpacity>


          <View style={s.rightActions}>
            <TouchableOpacity onPress={() => confirmDelete(item._id)} style={[s.iconBtn, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={tColors.textDark} />
          </TouchableOpacity>
          <View>
            <Text style={s.heading}>Manage Students</Text>
            <Text style={s.subHeading}>{currentBookings.length} Total Enrolled</Text>
          </View>
          <TouchableOpacity onPress={() => openForm()} style={s.addBtn}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} tintColor={tColors.primary} />}
      >
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { borderColor: '#10B981' }]}>
            <Text style={s.sumLbl}>Collected</Text>
            <Text style={[s.sumVal, { color: '#10B981' }]}>₹{totalCollected.toLocaleString()}</Text>
          </View>
          <View style={[s.summaryCard, { borderColor: '#DC2626' }]}>
            <Text style={s.sumLbl}>Pending</Text>
            <Text style={[s.sumVal, { color: '#DC2626' }]}>₹{totalPending.toLocaleString()}</Text>
          </View>
        </View>

        <View style={s.tabRow}>
          {[
            { key: 'All', count: parsedStudents.length },
            { key: 'Paid', count: parsedStudents.filter(s => !s.isDue).length },
            { key: 'Due', count: parsedStudents.filter(s => s.isDue || s.isSoon).length },
          ].map(t => (
            <TouchableOpacity 
              key={t.key} 
              style={[s.tab, activeTab === t.key && s.tabActive]} 
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.key}</Text>
              <View style={[s.tabCount, activeTab === t.key && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[s.tabCountText, activeTab === t.key && { color: '#FFF' }]}>{t.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id}
          renderItem={renderStudent}
          scrollEnabled={false}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color={tColors.border} />
              <Text style={s.emptyText}>No students found</Text>
              <Text style={s.emptySubText}>Tap the + button to add someone.</Text>
            </View>
          }
        />
      </ScrollView>

      {/* Add Student Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add New Student</Text>
            </View>
            
            <Text style={s.inputLabel}>Full Name</Text>
            <TextInput style={s.input} placeholder="e.g. Rahul Sharma" placeholderTextColor={tColors.textGray} value={form.name} onChangeText={(t) => setForm({...form, name: t})} />
            
            <Text style={s.inputLabel}>Phone Number</Text>
            <TextInput style={s.input} placeholder="10-digit number" placeholderTextColor={tColors.textGray} value={form.phone} onChangeText={(t) => setForm({...form, phone: t})} keyboardType="phone-pad" />
            
            <Text style={s.inputLabel}>Seat No.</Text>
            <TextInput style={s.input} placeholder="e.g. 12" placeholderTextColor={tColors.textGray} value={form.seat} onChangeText={(t) => setForm({...form, seat: t})} keyboardType="number-pad" />
            
            <Text style={s.inputLabel}>Plan Type</Text>
            <View style={s.planRow}>
              {['Half Time', 'Full Time'].map(p => (
                <TouchableOpacity key={p} style={[s.pBtn, form.plan === p && s.pBtnActive]} onPress={() => setForm({...form, plan: p})}>
                  <Ionicons name={p === 'Half Time' ? 'sunny-outline' : 'moon-outline'} size={18} color={form.plan === p ? tColors.primary : tColors.textGray} />
                  <Text style={[s.pText, form.plan === p && s.pTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelModal} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveModal} onPress={handleSave}>
                <Ionicons name="checkmark" size={18} color="#FFF" />
                <Text style={s.saveModalText}>Save Student</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Collect Fee Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <View style={s.paymentHeader}>
              <View style={s.paymentAvatar}>
                <Text style={s.paymentAvatarText}>{selectedStudent ? getInitials(selectedStudent.name) : ''}</Text>
              </View>
              <View>
                <Text style={s.modalTitle}>Collect Fee</Text>
                <Text style={s.paymentStudentName}>{selectedStudent?.name}</Text>
              </View>
            </View>
            
            <Text style={s.inputLabel}>Amount (₹)</Text>
            <TextInput style={s.input} value={paymentForm.amount} onChangeText={(t) => setPaymentForm({...paymentForm, amount: t})} keyboardType="number-pad" placeholder="0" placeholderTextColor={tColors.textGray} />

            <Text style={s.inputLabel}>Payment Method</Text>
            <View style={s.methodRow}>
              {[
                { key: 'UPI', icon: 'phone-portrait-outline' },
                { key: 'Cash', icon: 'cash-outline' },
              ].map(m => (
                <TouchableOpacity key={m.key} style={[s.methodBtn, paymentForm.method === m.key && s.methodBtnActive]} onPress={() => setPaymentForm({...paymentForm, method: m.key})}>
                  <Ionicons name={m.icon} size={20} color={paymentForm.method === m.key ? tColors.primary : tColors.textGray} />
                  <Text style={[s.methodText, paymentForm.method === m.key && s.methodTextActive]}>{m.key}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelModal} onPress={() => setPaymentModalVisible(false)}>
                <Text style={s.cancelModalText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.savePayment} onPress={handleCollectPayment}>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={s.saveModalText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
