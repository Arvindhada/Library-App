import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import colors from '../constants/colors';
import { useApp } from '../context/AppContext';
import { openWhatsApp } from '../services/whatsapp';

const LibraryCard = ({ library, onPress, showDistance = false, distance = null }) => {
  const { savedLibraryIds, toggleSaveLibrary } = useApp();
  const isSaved = savedLibraryIds.includes(library.id);
  const isOpen = library.isOpen24hrs || true; // simplified for demo
  const hasSeat = library.vacantSeats > 0;

  return (
    <TouchableOpacity testID={`library-card-${library.id}`} style={s.card} onPress={onPress} activeOpacity={0.85}>
      {/* Bookmark */}
      <TouchableOpacity testID={`bookmark-${library.id}`} style={s.bookmark} onPress={() => toggleSaveLibrary(library.id)}>
        <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? colors.primary : colors.textSecondary} />
      </TouchableOpacity>

      <View style={s.row}>
        {/* Photo */}
        <Image source={{ uri: library.photos?.[0] }} style={s.photo} />

        {/* Info */}
        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{library.name}</Text>
          <Text style={s.address} numberOfLines={1}>{library.address}</Text>

          {showDistance && distance != null && (
            <View style={s.distRow}>
              <Ionicons name="location" size={13} color={colors.primary} />
              <Text style={s.distText}>{distance} km away</Text>
            </View>
          )}

          {/* Seat badge */}
          <View style={[s.badge, hasSeat ? s.badgeGreen : s.badgeRed]}>
            <Text style={s.badgeText}>{hasSeat ? `${library.vacantSeats} Seats Available` : 'Full'}</Text>
          </View>

          {/* Fee + open */}
          <View style={s.bottomRow}>
            <Text style={s.fee}>From ₹{library.halfTime.fee}/mo</Text>
            <View style={s.openDot}>
              <View style={[s.dot, { backgroundColor: isOpen ? colors.success : colors.danger }]} />
              <Text style={[s.openText, { color: isOpen ? colors.success : colors.danger }]}>{isOpen ? 'Open' : 'Closed'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* WhatsApp mini button */}
      <TouchableOpacity
        testID={`whatsapp-${library.id}`}
        style={s.waBtn}
        onPress={(e) => { e.stopPropagation(); openWhatsApp(library.whatsapp, library.name); }}
      >
        <FontAwesome name="whatsapp" size={18} color={colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 12, borderWidth: 1, borderColor: colors.cardBorder, position: 'relative' },
  bookmark: { position: 'absolute', top: 10, right: 10, zIndex: 2, padding: 4 },
  row: { flexDirection: 'row' },
  photo: { width: 80, height: 90, borderRadius: 10, backgroundColor: colors.bgLight, marginRight: 12 },
  info: { flex: 1, paddingRight: 24 },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  address: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  distText: { fontSize: 12, color: colors.primary, marginLeft: 3, fontWeight: '500' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  badgeGreen: { backgroundColor: colors.success + '22' },
  badgeRed: { backgroundColor: colors.danger + '22' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fee: { fontSize: 13, fontWeight: '600', color: colors.primary },
  openDot: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  openText: { fontSize: 11, fontWeight: '600' },
  waBtn: { position: 'absolute', bottom: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' },
});

export default LibraryCard;
