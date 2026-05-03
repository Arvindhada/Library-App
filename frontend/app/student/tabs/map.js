// Student - Map Tab
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';



const DUMMY_LIBS = [
  {
    id: '1',
    name: 'The Study Point Library',
    location: 'Lalkothi',
    distance: '1.2 km',
    seatsFree: 15,
  },
  {
    id: '2',
    name: 'Vision Reading Zone',
    location: 'Mansarovar',
    distance: '2.0 km',
    seatsFree: 32,
  }
];

export default function StudentMap() {
  const router = useRouter();
  const { theme: tColors } = useApp();
  const [query, setQuery] = useState('');

  const goDetail = (id) => router.push({ pathname: '/student/library-detail', params: { id } });

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
    heading: { fontSize: 24, fontWeight: '700', color: tColors.textDark },
    filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: tColors.border },
    filterText: { fontSize: 14, fontWeight: '600', color: tColors.textDark },
    
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: tColors.cardBg, marginHorizontal: 20, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: tColors.border, marginBottom: 20 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: tColors.textDark },
    
    scrollContent: { paddingHorizontal: 20 },
    
    mapMockup: { height: 350, backgroundColor: tColors.primaryLight, borderRadius: 24, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: tColors.border },
    gridLine: { position: 'absolute', backgroundColor: 'rgba(29, 113, 81, 0.1)', height: 1 },
    
    pin: { position: 'absolute', alignItems: 'center' },
    pinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, zIndex: 2 },
    pinLabelBox: { backgroundColor: tColors.cardBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: tColors.border },
    pinLabelText: { fontSize: 10, fontWeight: '600', color: tColors.primary },
    
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16, marginBottom: 24 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: tColors.textGray, fontWeight: '500' },
    
    infoText: { fontSize: 13, color: tColors.textGray, marginBottom: 16, textAlign: 'center' },
    
    listContainer: { gap: 12 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: tColors.cardBg, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: tColors.border },
    listLeft: { flex: 1 },
    listName: { fontSize: 15, fontWeight: '700', color: tColors.textDark, marginBottom: 4 },
    listSub: { fontSize: 12, color: tColors.textGray },
    listRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    freeText: { fontSize: 13, fontWeight: '600', color: tColors.primary },
    goBtn: { backgroundColor: tColors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
    goText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  });

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.heading}>Map View</Text>
        <TouchableOpacity style={s.filterBtn}>
          <Text style={s.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={s.searchRow}>
        <Ionicons name="search" size={20} color={tColors.textGray} />
        <TextInput 
          style={s.searchInput} 
          placeholder="Area ya library..." 
          placeholderTextColor={tColors.textGray}
          value={query} 
          onChangeText={setQuery} 
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Mock Map Area */}
        <View style={s.mapMockup}>
          {/* We use absolute positioning to mock map pins */}
          
          <View style={[s.pin, { top: '30%', left: '20%' }]}>
            <View style={[s.pinDot, { backgroundColor: tColors.primary }]} />
            <View style={s.pinLabelBox}>
              <Text style={s.pinLabelText}>Study Point - ₹400</Text>
            </View>
          </View>
          
          <View style={[s.pin, { top: '50%', right: '30%' }]}>
            <View style={[s.pinDot, { backgroundColor: '#F5A623' }]} />
            <View style={s.pinLabelBox}>
              <Text style={s.pinLabelText}>Vision - ₹300</Text>
            </View>
          </View>

          <View style={[s.pin, { bottom: '20%', left: '40%' }]}>
            <View style={[s.pinDot, { backgroundColor: '#EF4444' }]} />
            <View style={s.pinLabelBox}>
              <Text style={s.pinLabelText}>Gyan Deep - ₹450</Text>
            </View>
          </View>

          {/* Map Grid Lines to make it look map-ish */}
          <View style={[s.gridLine, { top: '25%', width: '100%' }]} />
          <View style={[s.gridLine, { top: '75%', width: '100%' }]} />
          <View style={[s.gridLine, { left: '33%', height: '100%', width: 1 }]} />
          <View style={[s.gridLine, { left: '66%', height: '100%', width: 1 }]} />
        </View>

        {/* Legend */}
        <View style={s.legendRow}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: tColors.primary }]} />
            <Text style={s.legendText}>Selected</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: '#F5A623' }]} />
            <Text style={s.legendText}>Open</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={s.legendText}>Busy</Text>
          </View>
        </View>

        {/* Info Text */}
        <Text style={s.infoText}>3 libraries paas mein hain - tap karo details ke liye</Text>

        {/* List of nearby from map */}
        <View style={s.listContainer}>
          {DUMMY_LIBS.map((lib) => (
            <TouchableOpacity key={lib.id} style={s.listItem} onPress={() => goDetail(lib.id)} activeOpacity={0.8}>
              <View style={s.listLeft}>
                <Text style={s.listName}>{lib.name}</Text>
                <Text style={s.listSub}>{lib.distance} - {lib.location}</Text>
              </View>
              
              <View style={s.listRight}>
                <Text style={s.freeText}>{lib.seatsFree} free</Text>
                <View style={s.goBtn}>
                  <Text style={s.goText}>Go</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}


