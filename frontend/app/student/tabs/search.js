import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import LibraryCard from '../../../src/components/LibraryCard';

export default function StudentSearch() {
  const router = useRouter();
  const { libraries } = useApp();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('nearest');

  const filtered = libraries.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()) || l.area.toLowerCase().includes(query.toLowerCase())
  );

  const goDetail = (lib) => router.push({ pathname: '/student/library-detail', params: { id: lib.id } });

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.heading}>Search</Text></View>

      {/* Search Bar */}
      <View style={s.searchRow}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput testID="search-input" style={s.searchInput} placeholder="Search by name or area..." value={query} onChangeText={setQuery} autoFocus />
      </View>

      {/* Near Me Card */}
      <TouchableOpacity style={s.nearCard}>
        <Ionicons name="location" size={24} color={colors.primary} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={s.nearTitle}>Libraries Near Me</Text>
          <Text style={s.nearSub}>Find libraries closest to you</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>

      {/* Sort chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {['Nearest', 'Cheapest', 'Most Seats'].map((opt) => {
          const key = opt.toLowerCase().replace(' ', '_');
          return (
            <TouchableOpacity key={opt} style={[s.chip, sortBy === key && s.chipActive]} onPress={() => setSortBy(key)}>
              <Text style={[s.chipText, sortBy === key && s.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={s.resultCount}>{filtered.length} libraries found</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.map((lib, i) => (
          <LibraryCard key={lib.id} library={lib} onPress={() => goDetail(lib)} showDistance distance={(1.2 + i * 0.9).toFixed(1)} />
        ))}
        {filtered.length === 0 && <Text style={s.empty}>No libraries found</Text>}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 8, backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.cardBorder },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 10, fontSize: 15, color: colors.textPrimary },
  nearCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightOrangeBg, marginHorizontal: 16, marginTop: 14, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '33' },
  nearTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  nearSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  chips: { marginTop: 14, marginBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  chipTextActive: { color: colors.white },
  resultCount: { fontSize: 13, color: colors.textSecondary, paddingHorizontal: 16, paddingVertical: 10 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40, fontSize: 15 },
});
