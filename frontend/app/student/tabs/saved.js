import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { useApp } from '../../../src/context/AppContext';
import LibraryCard from '../../../src/components/LibraryCard';

export default function StudentSaved() {
  const router = useRouter();
  const { libraries, savedLibraryIds } = useApp();
  const saved = libraries.filter((l) => savedLibraryIds.includes(l.id));

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.heading}>Saved Libraries</Text></View>

      {saved.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="bookmark-outline" size={64} color={colors.textLight} />
          <Text style={s.emptyTitle}>No saved libraries yet</Text>
          <Text style={s.emptySub}>Explore and save libraries you like!</Text>
          <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/student/tabs/search')}>
            <Text style={s.browseBtnText}>Browse Libraries</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {saved.map((lib) => (
            <LibraryCard key={lib.id} library={lib} onPress={() => router.push({ pathname: '/student/library-detail', params: { id: lib.id } })} />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white },
  heading: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  browseBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10, marginTop: 20 },
  browseBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
