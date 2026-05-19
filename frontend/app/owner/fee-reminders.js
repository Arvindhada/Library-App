// Fee Reminder Screen — Shows all due/expiring students, send bulk WhatsApp reminders
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { useApp } from '../../src/context/AppContext';
import { sendFeeReminder } from '../../src/services/whatsapp';

export default function FeeReminders() {
  const router = useRouter();
  const { currentBookings: students, currentLibrary: lib } = useApp();
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState([]);

  const halfFee = lib?.half_time_fee || lib?.halfTime?.fee || 600;
  const fullFee = lib?.full_time_fee || lib?.fullTime?.fee || 1000;
  const libName = lib?.name || 'Your Library';

  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

  const dueStudents = useMemo(() => {
    return students
      .filter(s => s.status !== 'Rejected')
      .map(s => ({
        ...s,
        fee: s.plan === 'Half Time' || s.plan === 'Morning' ? halfFee : fullFee,
        isOverdue: s.expiry && s.expiry < todayStr,
        isDueSoon: s.expiry && s.expiry >= todayStr && s.expiry <= threeDaysStr,
      }))
      .filter(s => s.isOverdue || s.isDueSoon)
      .sort((a, b) => a.expiry?.localeCompare(b.expiry || ''));
  }, [students, halfFee, fullFee, todayStr]);

  const sendReminder = async (st) => {
    await sendFeeReminder(st.phone, st.name, st.fee, libName);
    setSentIds(prev => [...prev, st.id]);
  };

  const sendAllReminders = async () => {
    if (dueStudents.length === 0) {
      Alert.alert('No reminders needed', 'All students have paid their fees! 🎉');
      return;
    }

    Alert.alert(
      `Send ${dueStudents.length} Reminders?`,
      'WhatsApp will open one by one for each student.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send All',
          onPress: async () => {
            setSending(true);
            for (const st of dueStudents) {
              await sendFeeReminder(st.phone, st.name, st.fee, libName);
              setSentIds(prev => [...prev, st.id]);
              await new Promise(r => setTimeout(r, 1500)); // small delay between each
            }
            setSending(false);
            Alert.alert('Done! ✅', `Reminders sent to ${dueStudents.length} students.`);
          }
        }
      ]
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.heading}>Fee Reminders</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Summary Banner */}
      <View style={s.banner}>
        <View style={s.bannerIcon}>
          <FontAwesome name="whatsapp" size={28} color="#25D366" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>{dueStudents.length} students need reminders</Text>
          <Text style={s.bannerSub}>Overdue or expiring in 3 days</Text>
        </View>
      </View>

      {/* Student List */}
      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {dueStudents.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 40 }}>🎉</Text>
            <Text style={s.emptyText}>All students are up to date!</Text>
            <Text style={s.emptySub}>No fee reminders needed right now.</Text>
          </View>
        ) : (
          dueStudents.map(st => {
            const isSent = sentIds.includes(st.id);
            const expiryLabel = st.isOverdue
              ? `Overdue since ${new Date(st.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
              : `Expires ${new Date(st.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

            return (
              <View key={st.id} style={[s.card, isSent && { opacity: 0.6 }]}>
                <View style={[s.avatar, { backgroundColor: st.isOverdue ? colors.danger : colors.warning }]}>
                  <Ionicons name="person" size={18} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{st.name}</Text>
                  <Text style={s.phone}>{st.phone || 'No phone'}</Text>
                  <View style={s.tagRow}>
                    <View style={[s.tag, { backgroundColor: st.isOverdue ? colors.danger + '15' : colors.warning + '15' }]}>
                      <Text style={[s.tagText, { color: st.isOverdue ? colors.danger : colors.warning }]}>
                        {st.isOverdue ? '🔴 Overdue' : '🟡 Due Soon'}
                      </Text>
                    </View>
                    <Text style={s.expiryText}>{expiryLabel}</Text>
                  </View>
                </View>
                <View style={s.rightCol}>
                  <Text style={s.fee}>₹{st.fee}</Text>
                  <TouchableOpacity
                    style={[s.remindBtn, isSent && { backgroundColor: colors.success }]}
                    onPress={() => sendReminder(st)}
                    disabled={isSent}
                  >
                    <FontAwesome name="whatsapp" size={16} color={colors.white} />
                    <Text style={s.remindText}>{isSent ? 'Sent' : 'Remind'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Send All Button */}
      {dueStudents.length > 0 && (
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.sendAllBtn, sending && { opacity: 0.6 }]}
            onPress={sendAllReminders}
            disabled={sending}
          >
            <FontAwesome name="whatsapp" size={20} color={colors.white} style={{ marginRight: 10 }} />
            <Text style={s.sendAllText}>
              {sending ? 'Sending reminders...' : `Send All ${dueStudents.length} Reminders`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: colors.white },
  backBtn: { padding: 4 },
  heading: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },

  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#25D36615', margin: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#25D36630' },
  bannerIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#25D36620', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  bannerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  list: { flex: 1, paddingHorizontal: 16 },
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, alignItems: 'center', elevation: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  phone: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '600' },
  expiryText: { fontSize: 11, color: colors.textLight },
  rightCol: { alignItems: 'flex-end', gap: 8 },
  fee: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  remindBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#25D366', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, gap: 6 },
  remindText: { color: colors.white, fontSize: 12, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.cardBorder },
  sendAllBtn: { flexDirection: 'row', backgroundColor: '#25D366', paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sendAllText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
