import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import colors from '../constants/colors';
import { useApp } from '../context/AppContext';
import { openWhatsApp } from '../services/whatsapp';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const LibraryCard = ({ library, onPress, showDistance = false, distance = null }) => {
  const { savedLibraryIds, toggleSaveLibrary } = useApp();
  const isSaved = savedLibraryIds.includes(library.id);
  const isOpen = library.isOpen24hrs || true;
  const hasSeat = library.vacantSeats > 0;

  return (
    <TouchableOpacity testID={`library-card-${library.id}`} style={s.card} onPress={onPress} activeOpacity={0.85}>
      {/* Full-width photo on TOP */}
      <View style={s.imageWrap}>
        <Image source={{ uri: library.photos?.[0] }} style={s.photo} />
        {/* Bookmark on photo */}
        <TouchableOpacity testID={`bookmark-${library.id}`} style={s.bookmark} onPress={() => toggleSaveLibrary(library.id)}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? colors.primary : colors.white} />
        </TouchableOpacity>
        {/* Open badge on photo */}
        <View style={[s.openBadgeOnPhoto, { backgroundColor: isOpen ? colors.success : colors.danger }]}>
          <Text style={s.openBadgeText}>{isOpen ? 'Open' : 'Closed'}</Text>
        </View>
      </View>

      {/* Details below photo */}
      <View style={s.details}>
        <Text style={s.name} numberOfLines={1}>{library.name}</Text>
        <View style={s.addressRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={s.address} numberOfLines={1}>{library.address}</Text>
        </View>

        {/* Row: distance + seat badge */}
        <View style={s.midRow}>
          {showDistance && distance != null && (
            <View style={s.distBadge}>
              <Ionicons name="navigate" size={12} color={colors.primary} />
              <Text style={s.distText}>{distance} km</Text>
            </View>
          )}
          <View style={[s.seatBadge, hasSeat ? s.badgeGreen : s.badgeRed]}>
            <Text style={[s.seatBadgeText, { color: hasSeat ? colors.success : colors.danger }]}>
              {hasSeat ? `${library.vacantSeats} Seats Available` : 'Full'}
            </Text>
          </View>
        </View>

        {/* Bottom: fee + whatsapp */}
        <View style={s.bottomRow}>
          <View>
            <Text style={s.feeLabel}>Starting from</Text>
            <Text style={s.fee}>₹{library.halfTime.fee}/month</Text>
          </View>
          <TouchableOpacity
            testID={`whatsapp-${library.id}`}
            style={s.waBtn}
            onPress={(e) => { e.stopPropagation(); openWhatsApp(library.whatsapp, library.name); }}
          >
            <FontAwesome name="whatsapp" size={18} color={colors.white} />
            <Text style={s.waBtnText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 14, marginHorizontal: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder },
  imageWrap: { position: 'relative' },
  photo: { width: '100%', height: 160, backgroundColor: colors.bgLight },
  bookmark: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  openBadgeOnPhoto: { position: 'absolute', bottom: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  openBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  details: { padding: 14 },
  name: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  address: { flex: 1, fontSize: 13, color: colors.textSecondary, marginLeft: 4 },
  midRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  distBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightOrangeBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  distText: { fontSize: 12, color: colors.primary, marginLeft: 4, fontWeight: '600' },
  seatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeGreen: { backgroundColor: colors.success + '18' },
  badgeRed: { backgroundColor: colors.danger + '18' },
  seatBadgeText: { fontSize: 12, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 11, color: colors.textSecondary },
  fee: { fontSize: 16, fontWeight: '700', color: colors.primary },
  waBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#25D366', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  waBtnText: { color: colors.white, fontSize: 13, fontWeight: '600', marginLeft: 6 },
});

export default LibraryCard;
