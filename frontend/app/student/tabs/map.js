// Student - Map Tab
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Linking, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../src/context/AppContext';
import { calculateDistance, formatDistance } from '../../../src/services/distanceHelper';
import MapView, { Marker } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const openDirections = (lat, lng, label) => {
  const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
  const latLng = `${lat},${lng}`;
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`
  });
  
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  });
};

const openDirectionsByAddress = (address) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  Linking.openURL(url).catch(() => {
    console.warn("Could not open maps link");
  });
};

// Premium Minimal Map Style
const customMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  }
];

export default function StudentMap() {
  const router = useRouter();
  const { libraries, theme: tColors, userLocation, fetchUserLocation } = useApp();
  const [query, setQuery] = useState('');
  const [selectedLib, setSelectedLib] = useState(null);
  
  const bottomSheetRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchUserLocation();
  }, []);

  const filteredLibs = useMemo(() => {
    return libraries
      .map((lib, index) => {
        const libLat = lib.coordinates?.lat;
        const libLng = lib.coordinates?.lng;
        const userCoords = userLocation || { latitude: 26.9124, longitude: 75.7873 };
        
        let distance = null;
        if (libLat !== undefined && libLat !== null && libLng !== undefined && libLng !== null) {
          distance = calculateDistance(userCoords.latitude, userCoords.longitude, libLat, libLng);
        }
        
        return { ...lib, calculatedDistance: distance };
      })
      .filter(lib => {
        return lib.name?.toLowerCase().includes(query.toLowerCase()) ||
               lib.address?.toLowerCase().includes(query.toLowerCase());
      })
      .sort((a, b) => {
        if (a.calculatedDistance === null && b.calculatedDistance === null) return 0;
        if (a.calculatedDistance === null) return 1;
        if (b.calculatedDistance === null) return -1;
        return a.calculatedDistance - b.calculatedDistance;
      });
  }, [libraries, userLocation, query]);

  // Set default selected library when libraries are loaded/filtered
  useEffect(() => {
    if (filteredLibs.length > 0 && !selectedLib) {
      setSelectedLib(filteredLibs[0]);
    }
  }, [filteredLibs]);

  // Animate map to selected library
  const handleSelectLibrary = (lib) => {
    setSelectedLib(lib);
    if (lib.coordinates?.lat && lib.coordinates?.lng && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: lib.coordinates.lat,
        longitude: lib.coordinates.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
    bottomSheetRef.current?.snapToIndex(1); // Snap to 45%
  };

  const goDetail = (id) => router.push({ pathname: '/student/library-detail', params: { id } });

  const snapPoints = useMemo(() => ['18%', '45%', '85%'], []);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tColors.bg },
    map: { width: '100%', height: '100%' },
    
    // Floating Header on Map
    floatingHeader: {
      position: 'absolute',
      top: 50,
      left: 16,
      right: 16,
      zIndex: 10,
      gap: 12,
    },
    searchLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111',
      marginBottom: 6,
      textShadowColor: 'rgba(255,255,255,0.8)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 8,
    },
    
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#DDD',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },
    
    // Bottom Sheet Content
    bottomSheetContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    
    // Selected preview card styled premium
    selectedCard: {
      backgroundColor: tColors.cardBg,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.5,
      borderColor: tColors.primary,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    selectedCardLeft: { flex: 1, marginRight: 8 },
    selectedCardName: { fontSize: 16, fontWeight: '700', color: tColors.textDark, marginBottom: 4 },
    selectedCardSub: { fontSize: 12, color: tColors.textGray },
    routeBtn: {
      backgroundColor: '#2196F3',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },
    routeBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginLeft: 4 },
    
    infoText: { fontSize: 13, color: tColors.textGray, marginBottom: 12, textAlign: 'center', fontWeight: '500' },
    
    listContainer: { gap: 12 },
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: tColors.cardBg,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tColors.border
    },
    listLeft: { flex: 1 },
    listName: { fontSize: 15, fontWeight: '700', color: tColors.textDark, marginBottom: 4 },
    listSub: { fontSize: 12, color: tColors.textGray },
    listRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    freeText: { fontSize: 13, fontWeight: '600', color: tColors.primary },
    goBtn: { backgroundColor: tColors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
    goText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  });

  const mapInitialRegion = useMemo(() => ({
    latitude: userLocation?.latitude || 26.9124,
    longitude: userLocation?.longitude || 75.7873,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }), [userLocation]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={s.container}>
        {/* Floating Search on Map */}
        <View style={s.floatingHeader}>
          {/* Search Bar only — Filter removed */}
          <View style={s.searchRow}>
            <Ionicons name="search" size={20} color="#777" />
            <TextInput 
              style={s.searchInput} 
              placeholder="Area ya library dhundein..." 
              placeholderTextColor="#777"
              value={query} 
              onChangeText={setQuery} 
            />
          </View>
        </View>

        {/* Real Map View */}
        <MapView
          ref={mapRef}
          style={s.map}
          initialRegion={mapInitialRegion}
          showsUserLocation={true}
          customMapStyle={customMapStyle}
          showsCompass={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          showsPointsOfInterest={false}
        >
          {filteredLibs.map((lib) => {
            if (!lib.coordinates?.lat || !lib.coordinates?.lng) return null;
            const isSelected = selectedLib && (selectedLib._id === lib._id || selectedLib.id === lib.id);
            return (
              <Marker
                key={lib._id || lib.id}
                coordinate={{
                  latitude: lib.coordinates.lat,
                  longitude: lib.coordinates.lng,
                }}
                onPress={() => handleSelectLibrary(lib)}
              >
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: isSelected ? tColors.primary : '#F5A623',
                    borderWidth: 2,
                    borderColor: '#FFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                  }}>
                    <Ionicons name="book" size={14} color="#FFF" />
                  </View>
                  <View style={{
                    backgroundColor: '#FFF',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: '#DDD',
                    marginTop: 2,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#333' }}>
                      ₹{lib.halfTime?.fee || lib.half_time_fee || 300}
                    </Text>
                  </View>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Swipeable Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={1}
          backgroundStyle={{ backgroundColor: tColors.cardBg }}
          handleIndicatorStyle={{ backgroundColor: tColors.textGray }}
        >
          <BottomSheetScrollView contentContainerStyle={s.bottomSheetContent}>
            
            {/* Highlighted Selected Library Card */}
            {selectedLib && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => goDetail(selectedLib._id || selectedLib.id)}
                style={s.selectedCard}
              >
                <View style={s.selectedCardLeft}>
                  <Text style={s.selectedCardName} numberOfLines={1}>
                    {selectedLib.name}
                  </Text>
                  <Text style={s.selectedCardSub}>
                    {selectedLib.calculatedDistance === null ? 'Unknown' : formatDistance(selectedLib.calculatedDistance)} • {selectedLib.vacantSeats || selectedLib.available_seats || 0} seats free
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.routeBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (selectedLib.coordinates?.lat && selectedLib.coordinates?.lng) {
                      openDirections(selectedLib.coordinates.lat, selectedLib.coordinates.lng, selectedLib.name);
                    } else {
                      openDirectionsByAddress(selectedLib.address || selectedLib.name);
                    }
                  }}
                >
                  <Ionicons name="navigate" size={16} color="#FFF" />
                  <Text style={s.routeBtnText}>Route ➔</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            <Text style={s.infoText}>{filteredLibs.length} libraries paas mein hain</Text>

            {/* List of nearby libraries */}
            <View style={s.listContainer}>
              {filteredLibs.map((lib) => {
                const distanceStr = lib.calculatedDistance === null ? 'Unknown' : formatDistance(lib.calculatedDistance);
                const vacant = lib.vacantSeats || lib.available_seats || 0;
                const isSelected = selectedLib && (selectedLib._id === lib._id || selectedLib.id === lib.id);
                return (
                  <TouchableOpacity 
                    key={lib._id || lib.id} 
                    style={[
                      s.listItem, 
                      isSelected && { borderColor: tColors.primary, borderWidth: 1.5 }
                    ]} 
                    onPress={() => handleSelectLibrary(lib)} 
                    activeOpacity={0.8}
                  >
                    <View style={s.listLeft}>
                      <Text style={s.listName}>{lib.name}</Text>
                      <Text style={s.listSub}>{distanceStr} - {lib.address || 'Jaipur'}</Text>
                    </View>
                    
                    <View style={s.listRight}>
                      <Text style={s.freeText}>{vacant} free</Text>
                      <TouchableOpacity 
                        style={s.goBtn} 
                        onPress={(e) => {
                          e.stopPropagation();
                          if (lib.coordinates?.lat && lib.coordinates?.lng) {
                            openDirections(lib.coordinates.lat, lib.coordinates.lng, lib.name);
                          } else {
                            openDirectionsByAddress(lib.address || lib.name);
                          }
                        }}
                      >
                        <Text style={s.goText}>Route ➔</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
