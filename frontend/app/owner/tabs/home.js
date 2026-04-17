// Owner Home — Now shows library listing (same as Student Home)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import LibraryCard from '../../../src/components/LibraryCard';

export default function OwnerHome() {
  const router = useRouter();
  const { ownerData, libraries } = useApp();

  const goDetail = (lib) => router.push({ pathname: '/student/library-detail', params: { id: lib.id } });

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.hello}>Hello, {ownerData.name}!</Text>
          <View style={s.locRow}><Ionicons name="location" size={14} color={colors.primary} /><Text style={s.locText}>Jaipur, Rajasthan</Text></View>
        </View>
        <TouchableOpacity style={s.bell}><Ionicons name="notifications-outline" size={24} color={colors.textPrimary} /></TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity testID="owner-search-bar" style={s.searchBar} activeOpacity={0.8}>
        <Ionicons name="search" size={20} color={colors.textLight} />
        <Text style={s.searchPlaceholder}>Search libraries...</Text>
      </TouchableOpacity>

      {/* Libraries Near You */}
      <View style={s.section}>
        <Text style={s.secTitle}>Libraries Near You</Text>
        {libraries.slice(0, 3).map((lib, i) => (
          <LibraryCard key={lib.id} library={lib} onPress={() => goDetail(lib)} showDistance distance={(1.2 + i * 0.8).toFixed(1)} />
        ))}
      </View>

      {/* All Libraries */}
      <View style={s.section}>
        <Text style={s.secTitle}>All Libraries</Text>
        {libraries.map((lib) => (
          <LibraryCard key={lib.id} library={lib} onPress={() => goDetail(lib)} />
        ))}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white },
  hello: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locText: { fontSize: 13, color: colors.textSecondary, marginLeft: 4 },
  bell: { padding: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12, marginBottom: 4, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder },
  searchPlaceholder: { fontSize: 15, color: colors.textLight, marginLeft: 10 },
  section: { marginTop: 16 },
  secTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, marginBottom: 10 },
});
