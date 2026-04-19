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
    const statusLabel = item.isDue ? 'Fee Due' : item.isSoon ? 'Due Soon' : 'Paid';

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={[s.avatar, { backgroundColor: statusColor }]}>
            <Ionicons name="person" size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.stName}>{item.name}</Text>
            <Text style={s.stPhone}>{item.phone}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={s.cardInfo}>
          <View style={s.infoItem}><Ionicons name="grid-outline" size={14} color={colors.textLight} /><Text style={s.infoText}>Seat: {item.seat}</Text></View>
          <View style={s.infoItem}><Ionicons name="calendar-outline" size={14} color={colors.textLight} /><Text style={s.infoText}>Exp: {item.expiry}</Text></View>
          <View style={s.infoItem}><Text style={s.planTag}>{item.plan}</Text></View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.feeBtn} onPress={() => openPaymentModal(item)}>
            <Ionicons name="cash-outline" size={18} color={colors.success} />
            <Text style={s.feeText}>Collect Fee</Text>
          </TouchableOpacity>
          
          {(item.isDue || item.isSoon) && (
            <TouchableOpacity style={s.remindBtnSmall} onPress={() => handleReminder(item)}>
              <FontAwesome name="whatsapp" size={18} color="#25D366" />
              <Text style={s.remindTextSmall}>Remind</Text>
            </TouchableOpacity>
          )}

          <View style={s.rightActions}>
            <TouchableOpacity onPress={() => openForm(item)} style={s.iconBtn}><Ionicons name="create-outline" size={20} color={colors.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item.id)} style={s.iconBtn}><Ionicons name="trash-outline" size={20} color={colors.danger} /></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={s.heading}>Manage Students</Text>
        <TouchableOpacity onPress={() => openForm()} style={s.addBtn}><Ionicons name="add" size={24} color={colors.white} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Summary Card */}
        <View style={s.summaryCard}>
          <View style={s.sumBox}>
            <Text style={s.sumLbl}>Collected</Text>
            <Text style={s.sumVal}>₹{totalCollected.toLocaleString()}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.sumBox}>
            <Text style={s.sumLbl}>Total Due</Text>
            <Text style={[s.sumVal, { color: colors.danger }]}>₹{totalPending.toLocaleString()}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {['All', 'Paid', 'Due'].map(t => (
            <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t}</Text>
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
          ListEmptyComponent={<Text style={s.empty}>No students found in this category.</Text>}
        />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{editingStudent ? 'Edit Student' : 'Add New Student'}</Text>
            
            <TextInput style={s.input} placeholder="Student Name" value={form.name} onChangeText={(t)=>setForm({...form, name: t})} />
            <TextInput style={s.input} placeholder="Phone Number" value={form.phone} onChangeText={(t)=>setForm({...form, phone: t})} keyboardType="phone-pad" />
            
            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={s.inputLabel}>Seat</Text>
                <TextInput style={s.input} placeholder="No." value={form.seat} onChangeText={(t)=>setForm({...form, seat: t})} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={s.inputLabel}>Plan Type</Text>
                <View style={s.planRow}>
                  {['Half Time', 'Full Time'].map(p => (
                    <TouchableOpacity 
                      key={p} 
                      style={[s.pBtn, form.plan === p && s.pBtnActive]} 
                      onPress={() => setForm({...form, plan: p})}
                    >
                      <Text style={[s.pText, form.plan === p && s.pTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelModal} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveModal} onPress={handleSave}>
                <Text style={s.saveModalText}>Save Student</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
            <Text style={s.modalTitle}>Collect Fee ({selectedStudent?.name})</Text>
            
            <Text style={s.inputLabel}>Amount to Collect (₹)</Text>
            <TextInput 
              style={s.input} 
              value={paymentForm.amount} 
              onChangeText={(t)=>setPaymentForm({...paymentForm, amount: t})} 
              keyboardType="number-pad"
            />

            <Text style={s.inputLabel}>Payment Method</Text>
            <View style={s.methodRow}>
              {['UPI', 'Cash', 'Card'].map(m => (
                <TouchableOpacity 
                  key={m} 
                  style={[s.methodBtn, paymentForm.method === m && s.methodBtnActive]} 
                  onPress={() => setPaymentForm({...paymentForm, method: m})}
                >
                  <Text style={[s.methodText, paymentForm.method === m && s.methodTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelModal} onPress={() => setPaymentModalVisible(false)}>
                <Text style={s.cancelModalText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.savePayment} onPress={handleCollectPayment}>
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
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white, justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  heading: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  
  // Summary Card
  summaryCard: { flexDirection: 'row', backgroundColor: colors.white, margin: 16, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sumBox: { flex: 1, alignItems: 'center' },
  sumLbl: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  sumVal: { fontSize: 18, fontWeight: 'bold', color: colors.success },
  divider: { width: 1, backgroundColor: colors.cardBorder, height: '100%' },

  // Tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.white },

  list: { paddingHorizontal: 16 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  stPhone: { fontSize: 13, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  
  cardInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.bgLight, marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: colors.textSecondary },
  planTag: { fontSize: 11, fontWeight: '600', color: colors.primary, backgroundColor: colors.lightOrangeBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.success + '10', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10 },
  feeText: { fontSize: 12, fontWeight: 'bold', color: colors.success },
  
  remindBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#25D36610', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10 },
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
