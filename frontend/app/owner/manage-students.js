import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';
import { sendFeeReminder } from '../../src/services/whatsapp';

export default function ManageStudents() {
  const router = useRouter();
  const { students, saveStudent, deleteStudent, addPayment, getOwnerLibrary } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Paid' | 'Due'

  const [form, setForm] = useState({ name: '', phone: '', seat: '', plan: 'Full Time', expiry: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'UPI' });

  // Summary Logic
  const lib = getOwnerLibrary();
  
  const parsedStudents = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    const twoDaysLaterStr = twoDaysLater.toISOString().split('T')[0];
    
    return students.map(s => {
      const isDue = s.expiry < todayStr;
      const isSoon = !isDue && s.expiry <= twoDaysLaterStr;
      const fee = s.plan === 'Half Time' ? lib.halfTime.fee : lib.fullTime.fee;
      
      return { ...s, isDue, isSoon, fee };
    });
  }, [students, lib]);

  const totalCollected = React.useMemo(() => 
    parsedStudents.filter(s => !s.isDue).reduce((acc, s) => acc + s.fee, 0),
  [parsedStudents]);

  const totalPending = React.useMemo(() => 
    parsedStudents.filter(s => s.isDue).reduce((acc, s) => acc + s.fee, 0),
  [parsedStudents]);

  const filteredStudents = React.useMemo(() => {
    return parsedStudents.filter(s => {
      if (activeTab === 'Paid') return !s.isDue;
      if (activeTab === 'Due') return s.isDue || s.isSoon;
      return true;
    });
  }, [parsedStudents, activeTab]);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const openForm = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setForm(student);
    } else {
      setEditingStudent(null);
      setForm({ name: '', phone: '', seat: '', plan: 'Full Time', expiry: new Date().toISOString().split('T')[0] });
    }
    setModalVisible(true);
  };

  const openPaymentModal = (student) => {
    setSelectedStudent(student);
    setPaymentForm({ amount: String(student.fee), method: 'UPI' });
    setPaymentModalVisible(true);
  };

  const handleCollectPayment = () => {
    if (!paymentForm.amount) return;
    
    // Record Payment
    addPayment({
      studentId: selectedStudent.id,
      amount: parseInt(paymentForm.amount, 10),
      method: paymentForm.method,
      date: new Date().toISOString().split('T')[0]
    });

    // KEY FIX: If student's expiry is already in the past, 
    // start the new 30-day plan from TODAY (not old date).
    // If expiry is in future, add to the current expiry.
    const todayStr = new Date().toISOString().split('T')[0];
    const isAlreadyExpired = selectedStudent.expiry < todayStr;
    
    const baseDate = isAlreadyExpired
      ? new Date() // Today as base for expired students
      : new Date(selectedStudent.expiry); // Future expiry as base
    
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);
    const newExpiry = newExpiryDate.toISOString().split('T')[0];

    // Remove computed props before saving
    const { isDue, isSoon, fee, ...originalData } = selectedStudent;
    saveStudent({ 
      ...originalData,
      expiry: newExpiry, 
      status: 'Active' 
    });

    setPaymentModalVisible(false);
    Alert.alert(
      '✅ Payment Recorded',
      isAlreadyExpired
        ? `Plan renewed from Today.\nNew Expiry: ${newExpiry}`
        : `Plan extended.\nNew Expiry: ${newExpiry}`
    );
  };

  const handleReminder = (st) => {
    sendFeeReminder(st.phone, st.name, st.fee, lib.name);
  };

  const handleSave = () => {
    if (!form.name || !form.seat) {
      Alert.alert('Error', 'Please fill name and seat number');
      return;
    }
    saveStudent(editingStudent ? { ...form, id: editingStudent.id } : form);
    setModalVisible(false);
  };

  const confirmDelete = (id) => {
    Alert.alert('Delete Student', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteStudent(id) },
    ]);
  };

  const renderStudent = ({ item }) => {
    const statusColor = item.isDue ? colors.danger : item.isSoon ? colors.warning : colors.success;
    const statusLabel = item.isDue ? 'Fee Due' : item.isSoon ? 'Expiring Soon' : 'Active';
    const statusIcon = item.isDue ? 'alert-circle' : item.isSoon ? 'time' : 'checkmark-circle';

    return (
      <View style={s.card}>
        {/* Card Top Row */}
        <View style={s.cardHeader}>
          <View style={[s.avatar, { backgroundColor: statusColor }]}>
            <Text style={s.avatarText}>{getInitials(item.name)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.stName}>{item.name}</Text>
            <Text style={s.stPhone}>📞 {item.phone}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '15', borderWidth: 1, borderColor: statusColor + '30' }]}>
            <Ionicons name={statusIcon} size={12} color={statusColor} />
            <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Info Row */}
        <View style={s.infoStrip}>
          <View style={s.infoChip}>
            <Ionicons name="grid-outline" size={13} color={colors.primary} />
            <Text style={s.infoChipText}>Seat {item.seat}</Text>
          </View>
          <View style={s.infoChip}>
            <Ionicons name="calendar-outline" size={13} color={colors.primary} />
            <Text style={s.infoChipText}>Exp: {item.expiry}</Text>
          </View>
          <View style={[s.infoChip, { backgroundColor: colors.lightOrangeBg }]}>
            <Text style={[s.infoChipText, { color: colors.primary, fontWeight: 'bold' }]}>{item.plan}</Text>
          </View>
        </View>

        {/* Actions Row */}
        <View style={s.actions}>
          <TouchableOpacity style={s.feeBtn} onPress={() => openPaymentModal(item)}>
            <Ionicons name="cash-outline" size={16} color={colors.white} />
            <Text style={s.feeText}>Collect ₹{item.fee}</Text>
          </TouchableOpacity>
          
          {(item.isDue || item.isSoon) && (
            <TouchableOpacity style={s.remindBtnSmall} onPress={() => handleReminder(item)}>
              <FontAwesome name="whatsapp" size={16} color="#25D366" />
              <Text style={s.remindTextSmall}>Remind</Text>
            </TouchableOpacity>
          )}

          <View style={s.rightActions}>
            <TouchableOpacity onPress={() => openForm(item)} style={s.iconBtn}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item.id)} style={[s.iconBtn, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Orange Header */}
      <View style={s.header}>
        <View style={s.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
          <View>
            <Text style={s.heading}>Manage Students</Text>
            <Text style={s.subHeading}>{students.length} total students</Text>
          </View>
          <TouchableOpacity onPress={() => openForm()} style={s.addBtn}>
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={s.headerCurve} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Summary Cards */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { borderLeftColor: colors.success }]}>
            <Text style={s.sumLbl}>Collected</Text>
            <Text style={[s.sumVal, { color: colors.success }]}>₹{totalCollected.toLocaleString()}</Text>
          </View>
          <View style={[s.summaryCard, { borderLeftColor: colors.danger }]}>
            <Text style={s.sumLbl}>Pending</Text>
            <Text style={[s.sumVal, { color: colors.danger }]}>₹{totalPending.toLocaleString()}</Text>
          </View>
          <View style={[s.summaryCard, { borderLeftColor: colors.info }]}>
            <Text style={s.sumLbl}>Total</Text>
            <Text style={[s.sumVal, { color: colors.info }]}>{students.length}</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={s.tabRow}>
          {[
            { key: 'All', icon: 'people', count: parsedStudents.length },
            { key: 'Paid', icon: 'checkmark-circle', count: parsedStudents.filter(s => !s.isDue).length },
            { key: 'Due', icon: 'alert-circle', count: parsedStudents.filter(s => s.isDue || s.isSoon).length },
          ].map(t => (
            <TouchableOpacity 
              key={t.key} 
              style={[s.tab, activeTab === t.key && s.tabActive]} 
              onPress={() => setActiveTab(t.key)}
            >
              <Ionicons name={t.icon} size={15} color={activeTab === t.key ? colors.white : colors.textSecondary} />
              <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.key}</Text>
              <View style={[s.tabCount, activeTab === t.key && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={[s.tabCountText, activeTab === t.key && { color: colors.white }]}>{t.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredStudents}
          extraData={students}
          keyExtractor={(item) => item.id}
          renderItem={renderStudent}
          scrollEnabled={false}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={60} color={colors.textLight} />
              <Text style={s.emptyText}>No students in this category</Text>
              <Text style={s.emptySubText}>Tap + to add a new student</Text>
            </View>
          }
        />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingStudent ? 'Edit Student' : 'Add New Student'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textLight} />
              </TouchableOpacity>
            </View>
            
            <Text style={s.inputLabel}>Full Name</Text>
            <TextInput style={s.input} placeholder="e.g. Rahul Sharma" placeholderTextColor={colors.textLight} value={form.name} onChangeText={(t) => setForm({...form, name: t})} />
            
            <Text style={s.inputLabel}>Phone Number</Text>
            <TextInput style={s.input} placeholder="10-digit number" placeholderTextColor={colors.textLight} value={form.phone} onChangeText={(t) => setForm({...form, phone: t})} keyboardType="phone-pad" />
            
            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.inputLabel}>Seat No.</Text>
                <TextInput style={s.input} placeholder="e.g. 12" placeholderTextColor={colors.textLight} value={form.seat} onChangeText={(t) => setForm({...form, seat: t})} keyboardType="number-pad" />
              </View>
            </View>
            
            <Text style={s.inputLabel}>Plan Type</Text>
            <View style={s.planRow}>
              {['Half Time', 'Full Time'].map(p => (
                <TouchableOpacity 
                  key={p} 
                  style={[s.pBtn, form.plan === p && s.pBtnActive]} 
                  onPress={() => setForm({...form, plan: p})}
                >
                  <Ionicons name={p === 'Half Time' ? 'sunny-outline' : 'moon-outline'} size={16} color={form.plan === p ? colors.primary : colors.textSecondary} />
                  <Text style={[s.pText, form.plan === p && s.pTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelModal} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveModal} onPress={handleSave}>
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={s.saveModalText}>Save Student</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
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
            <TextInput 
              style={[s.input, s.amountInput]} 
              value={paymentForm.amount} 
              onChangeText={(t) => setPaymentForm({...paymentForm, amount: t})} 
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textLight}
            />

            <Text style={s.inputLabel}>Payment Method</Text>
            <View style={s.methodRow}>
              {[
                { key: 'UPI', icon: 'phone-portrait-outline' },
                { key: 'Cash', icon: 'cash-outline' },
                { key: 'Card', icon: 'card-outline' },
              ].map(m => (
                <TouchableOpacity 
                  key={m.key} 
                  style={[s.methodBtn, paymentForm.method === m.key && s.methodBtnActive]} 
                  onPress={() => setPaymentForm({...paymentForm, method: m.key})}
                >
                  <Ionicons name={m.icon} size={18} color={paymentForm.method === m.key ? colors.primary : colors.textSecondary} />
                  <Text style={[s.methodText, paymentForm.method === m.key && s.methodTextActive]}>{m.key}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelModal} onPress={() => setPaymentModalVisible(false)}>
                <Text style={s.cancelModalText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.savePayment} onPress={handleCollectPayment}>
                <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                <Text style={s.saveModalText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  
  // HEADER
  header: { backgroundColor: colors.primary, paddingTop: 55, paddingBottom: 0 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 22 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: 'bold', color: colors.white, textAlign: 'center' },
  subHeading: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCurve: { height: 28, backgroundColor: '#F9FAFB', borderTopLeftRadius: 28, borderTopRightRadius: 28 },

  // SUMMARY
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -6, gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: colors.white, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  sumLbl: { fontSize: 11, color: colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  sumVal: { fontSize: 17, fontWeight: 'bold' },

  // TABS
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 18, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: colors.white, gap: 5, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  tabTextActive: { color: colors.white },
  tabCount: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabCountText: { fontSize: 10, color: colors.textSecondary, fontWeight: 'bold' },

  // STUDENT CARDS
  list: { paddingHorizontal: 16 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 18, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.white, fontWeight: 'bold', fontSize: 17 },
  stName: { fontSize: 17, fontWeight: 'bold', color: colors.textPrimary },
  stPhone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  
  infoStrip: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  infoChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.success, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  feeText: { fontSize: 12, fontWeight: 'bold', color: colors.white },
  
  remindBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  remindTextSmall: { fontSize: 12, fontWeight: 'bold', color: '#25D366' },
  
  rightActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, backgroundColor: colors.bgLight, borderRadius: 8 },

  empty: { textAlign: 'center', color: colors.textLight, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  
  inputLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  planRow: { flexDirection: 'row', gap: 6 },
  pBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', backgroundColor: colors.bgLight },
  pBtnActive: { borderColor: colors.primary, backgroundColor: colors.lightOrangeBg },
  pText: { fontSize: 13, color: colors.textSecondary },
  pTextActive: { color: colors.primary, fontWeight: 'bold' },
  
  input: { backgroundColor: colors.bgLight, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.cardBorder },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  methodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  methodBtnActive: { borderColor: colors.primary, backgroundColor: colors.lightOrangeBg },
  methodText: { fontSize: 14, color: colors.textSecondary },
  methodTextActive: { color: colors.primary, fontWeight: 'bold' },
  
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelModal: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  cancelModalText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  saveModal: { flex: 2, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  savePayment: { flex: 2, backgroundColor: colors.success, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveModalText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
