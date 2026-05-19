// Student - Map Tab (Fully Ready & Polished)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';

export default function StudentMap() {
  const router = useRouter();
  const { libraries, theme: tColors, fetchLibraries, loading } = useApp();
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);

  // Ensure libraries are fetched when screen opens
  useEffect(() => {
    fetchLibraries();
  }, []);

  const filters = [
    { id: 'ac', label: 'AC', icon: 'snow' },
    { id: 'wifi', label: 'WiFi', icon: 'wifi' },
    { id: 'seats', label: 'Available', icon: 'people' },
  ];

  const toggleFilter = (id) => {
    setActiveFilters(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const goDetail = (id) => router.push({ pathname: '/student/library-detail', params: { id } });

  const filteredLibraries = libraries.filter(lib => {
    const matchesSearch = !query || 
      lib.name?.toLowerCase().includes(query.toLowerCase()) || 
      lib.area?.toLowerCase().includes(query.toLowerCase());
    
    const matchesAC = !activeFilters.includes('ac') || lib.ac_available;
    const matchesWiFi = !activeFilters.includes('wifi') || lib.wifi_available;
    const matchesSeats = !activeFilters.includes('seats') || lib.vacantSeats > 0;

    return matchesSearch && matchesAC && matchesWiFi && matchesSeats;
  });

  // Deterministic positions for map pins based on ID
  const getPinPos = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const x = Math.abs(hash % 75) + 10; // 10% to 85%
    const y = Math.abs((hash >> 8) % 65) + 15; // 15% to 80%
    return { top: `${y}%`, left: `${x}%` };
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
    heading: { fontSize: 28, fontWeight: '900', color: tColors.textDark, marginBottom: 15, letterSpacing: -0.5 },
    
    searchContainer: { marginHorizontal: 24, marginBottom: 15 },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.cardBg, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: tColors.border, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: tColors.textDark, fontWeight: '600' },
    
    filtersScroll: { paddingLeft: 24, marginBottom: 20 },
    filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.cardBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: tColors.border, elevation: 2 },
    filterChipActive: { backgroundColor: tColors.primary, borderColor: tColors.primary },
    filterLabel: { fontSize: 13, fontWeight: '700', color: tColors.textDark, marginLeft: 6 },
    filterLabelActive: { color: '#FFF' },

    scrollContent: { paddingBottom: 100 },
    
    mapMockup: { height: 400, backgroundColor: tColors.primaryLight, marginHorizontal: 20, borderRadius: 32, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: tColors.border, marginBottom: 25, elevation: 5 },
    // Road simulation lines
    roadH: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.4)', height: 20, width: '120%', transform: [{ rotate: '-15deg' }] },
    roadV: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.4)', width: 20, height: '120%', transform: [{ rotate: '10deg' }] },
    
    pin: { position: 'absolute', alignItems: 'center', zIndex: 10 },
    pinDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: '#FFF', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
    pinLabelBox: { backgroundColor: tColors.cardBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 6, borderWidth: 1, borderColor: tColors.border, elevation: 3, maxWidth: 100 },
    pinLabelText: { fontSize: 10, fontWeight: '800', color: tColors.textDark },
    pinPriceText: { fontSize: 9, fontWeight: '700', color: tColors.primary, marginTop: 1 },
    
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 30 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendText: { fontSize: 13, color: tColors.textGray, fontWeight: '700' },
    
    listSection: { paddingHorizontal: 24 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
    listTitle: { fontSize: 20, fontWeight: '900', color: tColors.textDark },
    listCount: { fontSize: 13, color: tColors.textGray, fontWeight: '600' },

    listContainer: { gap: 15 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: tColors.cardBg, padding: 20, borderRadius: 28, borderWidth: 1, borderColor: tColors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
    listLeft: { flex: 1 },
    listName: { fontSize: 17, fontWeight: '800', color: tColors.textDark, marginBottom: 5 },
    listSub: { fontSize: 13, color: tColors.textGray, fontWeight: '600' },
    listRight: { alignItems: 'flex-end', gap: 8 },
    freeText: { fontSize: 13, fontWeight: '800', color: tColors.primary },
    goBtn: { backgroundColor: tColors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, elevation: 3 },
    goText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

    loader: { marginTop: 50 },
    empty: { padding: 50, alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: tColors.textDark, marginTop: 15 },
    emptySub: { fontSize: 14, color: tColors.textGray, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  });

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.heading}>Find on Map</Text>
      </View>

      {/* Search Bar */}
      <View style={s.searchContainer}>
        <View style={s.searchRow}>
          <Ionicons name="search" size={20} color={tColors.primary} />
          <TextInput 
            style={s.searchInput} 
            placeholder="Search area, city or library..." 
            placeholderTextColor={tColors.textGray}
            value={query} 
            onChangeText={setQuery} 
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={22} color={tColors.textGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll}>
          {filters.map(f => (
            <TouchableOpacity 
              key={f.id} 
              style={[s.filterChip, activeFilters.includes(f.id) && s.filterChipActive]}
              onPress={() => toggleFilter(f.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={f.icon} size={15} color={activeFilters.includes(f.id) ? '#FFF' : tColors.textDark} />
              <Text style={[s.filterLabel, activeFilters.includes(f.id) && s.filterLabelActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Mock Map Area */}
        <View style={s.mapMockup}>
          {/* Decorative Road Lines */}
          <View style={[s.roadH, { top: '30%', left: -20 }]} />
          <View style={[s.roadH, { top: '70%', left: -20, height: 15 }]} />
          <View style={[s.roadV, { left: '30%', top: -20 }]} />
          <View style={[s.roadV, { left: '80%', top: -20, width: 15 }]} />

          {/* Dynamic Map Pins for all filtered libraries */}
          {filteredLibraries.map((lib) => {
            const pos = getPinPos(lib._id || lib.id);
            return (
              <TouchableOpacity key={lib._id || lib.id} style={[s.pin, pos]} onPress={() => goDetail(lib._id || lib.id)} activeOpacity={0.9}>
                <View style={[s.pinDot, { backgroundColor: lib.vacantSeats > 10 ? tColors.primary : (lib.vacantSeats > 0 ? '#F5A623' : '#EF4444') }]} />
                <View style={s.pinLabelBox}>
                  <Text style={s.pinLabelText} numberOfLines={1}>{lib.name}</Text>
                  <Text style={s.pinPriceText}>₹{lib.full_time_fee || 1000}/mo</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredLibraries.length === 0 && !loading && (
             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(0,0,0,0.2)', fontWeight: '800', fontSize: 24 }}>NO RESULTS</Text>
             </View>
          )}
        </View>

        {/* Legend */}
        <View style={s.legendRow}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: tColors.primary }]} />
            <Text style={s.legendText}>High Vacancy</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: '#F5A623' }]} />
            <Text style={s.legendText}>Few Seats</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={s.legendText}>Full</Text>
          </View>
        </View>

        {/* List Section */}
        <View style={s.listSection}>
          <View style={s.listHeader}>
            <Text style={s.listTitle}>Nearby Libraries</Text>
            <Text style={s.listCount}>{filteredLibraries.length} results</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={tColors.primary} size="large" style={s.loader} />
          ) : (
            <View style={s.listContainer}>
              {filteredLibraries.map((lib) => (
                <TouchableOpacity key={lib._id || lib.id} style={s.listItem} onPress={() => goDetail(lib._id || lib.id)} activeOpacity={0.8}>
                  <View style={s.listLeft}>
                    <Text style={s.listName} numberOfLines={1}>{lib.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location" size={12} color={tColors.textGray} />
                      <Text style={s.listSub} numberOfLines={1}> {lib.area || 'Main Road'} • 0.8 km</Text>
                    </View>
                  </View>
                  
                  <View style={s.listRight}>
                    <Text style={[s.freeText, { color: lib.vacantSeats > 0 ? tColors.primary : '#EF4444' }]}>
                      {lib.vacantSeats} {lib.vacantSeats === 1 ? 'seat' : 'seats'} free
                    </Text>
                    <View style={[s.goBtn, { opacity: lib.vacantSeats > 0 ? 1 : 0.6 }]}>
                      <Text style={s.goText}>Details</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              {filteredLibraries.length === 0 && (
                <View style={s.empty}>
                  <Ionicons name="map-outline" size={60} color={tColors.border} />
                  <Text style={s.emptyTitle}>Nothing found</Text>
                  <Text style={s.emptySub}>Aapki search filters ke hisaab se koi library nahi mili. Try different filters.</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
