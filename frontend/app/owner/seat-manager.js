// Seat Manager — Redesigned with mockup styling, Stitch Design Identity & Shift Filters
import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  RefreshControl,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import SeatBox from '../../src/components/SeatBox';

// ── Stitch "LibConnect Design Identity" Colors ──
const C = {
  bg: '#F5F3EE',          // Warm sand/beige background
  surface: '#FFFFFF',
  primary: '#0F6E56',     // Teal Green
  primaryLight: '#E8F5F0',
  primaryBorder: '#9FE1CB',
  textDark: '#1A1C1B',
  textGray: '#6F7A74',
  border: '#D1CFCA',
  orange: '#C2410C',
  orangeLight: '#FFF3E8',
  orangeBorder: '#FDDCBB',
};

export default function SeatManager() {
  const router = useRouter();
  const { currentLibrary, currentBookings, fetchDashboardData, loading, vacateSeat } = useApp();

  const total = currentLibrary?.totalSeats || currentLibrary?.total_seats || 48;
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'free' | 'occupied' | 'expiring'
  const [selectedShift, setSelectedShift] = useState(null); // null | 'Morning' | 'Evening' | 'Full Day'

  // Compute all seat states dynamically
  const seats = useMemo(() => {
    const today = new Date();
    const arr = [];
    const totalSeats = total || 48;
    for (let i = 1; i <= totalSeats; i++) {
      // Find active booking for this seat
      const booking = currentBookings.find(
        b => b.status === 'Active' && parseInt(b.seat, 10) === i
      );

      // Numeric seat label
      const label = String(i);

      let isExpiring = false;
      let isFeeDue = false;
      if (booking) {
        const endDate = new Date(booking.endDate);
        const timeDiff = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        // Flag as expiring if end date is in the past, or within 2 days
        isExpiring = diffDays <= 2;
        isFeeDue = endDate < today;
      }

      arr.push({
        number: i,
        label,
        booked: !!booking,
        studentName: booking?.student?.name || '',
        studentPhone: booking?.student?.phone || '',
        studentExpiry: booking ? new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null,
        studentPlan: booking?.shift || 'Full Day',
        isFeeDue,
        isExpiring,
        bookingId: booking?._id,
        booking: booking || null,
      });
    }
    return arr;
  }, [currentBookings, total]);

  // Sync selected seat details after state change (e.g. vacating a seat)
  const currentSelectedSeatDetails = useMemo(() => {
    if (!selectedSeat) return null;
    return seats.find(s => s.number === selectedSeat.number) || null;
  }, [seats, selectedSeat]);

  // Counts for pills
  const counts = useMemo(() => {
    const free = seats.filter(s => !s.booked).length;
    const expiring = seats.filter(s => s.booked && s.isExpiring).length;
    const occupied = seats.filter(s => s.booked && !s.isExpiring).length;
    return {
      all: seats.length,
      free,
      occupied,
      expiring,
    };
  }, [seats]);

  // Counts for shifts based on booking data
  const shiftCounts = useMemo(() => {
    let morning = 0;
    let evening = 0;
    let fullDay = 0;
    
    seats.forEach(s => {
      if (s.booked) {
        const plan = s.studentPlan?.toLowerCase() || '';
        if (plan.includes('morning') || plan.includes('half')) {
          morning++;
        } else if (plan.includes('evening')) {
          evening++;
        } else if (plan.includes('full')) {
          fullDay++;
        }
      }
    });
    
    return { morning, evening, fullDay };
  }, [seats]);


  const handleWhatsAppAlert = (seat) => {
    const phone = seat.studentPhone;
    const name = seat.studentName;
    const label = seat.label;
    if (!phone) {
      Alert.alert('Error', 'Student phone number not available.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `Hello ${name}, your booking for Seat ${label} at ${currentLibrary?.name || 'our Library'} is expiring soon. Please renew your slot to avoid cancellation. Thank you!`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}&phone=${formattedPhone}`;

    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}&phone=${formattedPhone}`;
        Linking.openURL(webUrl).catch(() => {
          Alert.alert('Error', 'Could not open WhatsApp.');
        });
      }
    });
  };

  const handleVacateSeat = (seat) => {
    Alert.alert(
      'Free Seat',
      `Are you sure you want to vacate Seat ${seat.label}? This will end the current active booking for ${seat.studentName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Vacate', 
          style: 'destructive',
          onPress: async () => {
            await vacateSeat(seat.number, seat.bookingId);
            Alert.alert('Success', `Seat ${seat.label} is now vacant.`);
          }
        }
      ]
    );
  };

  // Safe handler to toggle active filter pill
  const handleFilterSelect = (filter) => {
    setActiveFilter(filter);
    setSelectedShift(null); // Clear shift filter to avoid clash
    setSelectedSeat(null);
  };

  // Safe handler to toggle shift card filter
  const handleShiftSelect = (shift) => {
    if (selectedShift === shift) {
      setSelectedShift(null); // Toggle off if clicked again
    } else {
      setSelectedShift(shift);
      setActiveFilter('all'); // Reset status filters to avoid conflict
    }
    setSelectedSeat(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.container}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <TouchableOpacity testID="seat-mgr-back" onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Seat Manager</Text>
          <TouchableOpacity 
            style={s.addBtn}
            onPress={() => router.push('/owner/tabs/students')}
          >
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} colors={[C.primary]} />}
        >
          {/* ── STATUS FILTER PILLS ── */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={s.filterScroll}
            contentContainerStyle={s.filterContainer}
          >
            <TouchableOpacity 
              style={[s.filterPill, activeFilter === 'all' && !selectedShift && s.filterPillActive]}
              onPress={() => handleFilterSelect('all')}
            >
              <Text style={[s.filterText, activeFilter === 'all' && !selectedShift && s.filterTextActive]}>
                All ({counts.all})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.filterPill, activeFilter === 'free' && s.filterPillActive]}
              onPress={() => handleFilterSelect('free')}
            >
              <Text style={[s.filterText, activeFilter === 'free' && s.filterTextActive]}>
                Free ({counts.free})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.filterPill, activeFilter === 'occupied' && s.filterPillActive]}
              onPress={() => handleFilterSelect('occupied')}
            >
              <Text style={[s.filterText, activeFilter === 'occupied' && s.filterTextActive]}>
                Occupied ({counts.occupied})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.filterPill, activeFilter === 'expiring' && s.filterPillActive]}
              onPress={() => handleFilterSelect('expiring')}
            >
              <Text style={[s.filterText, activeFilter === 'expiring' && s.filterTextActive]}>
                Expiring ({counts.expiring})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── SEAT GRID ── */}
          <View style={s.gridCard}>
            <FlatList
              data={seats}
              keyExtractor={(item) => String(item.number)}
              numColumns={8}
              scrollEnabled={false}
              columnWrapperStyle={s.gridRow}
              renderItem={({ item }) => {
                // Filter matches logic
                let matches = true;
                if (selectedShift) {
                  const plan = item.studentPlan?.toLowerCase() || '';
                  if (selectedShift === 'Morning') {
                    matches = item.booked && (plan.includes('morning') || plan.includes('half'));
                  } else if (selectedShift === 'Evening') {
                    matches = item.booked && plan.includes('evening');
                  } else if (selectedShift === 'Full Day') {
                    matches = item.booked && plan.includes('full');
                  }
                } else {
                  if (activeFilter === 'free') matches = !item.booked;
                  else if (activeFilter === 'occupied') matches = item.booked && !item.isExpiring;
                  else if (activeFilter === 'expiring') matches = item.booked && item.isExpiring;
                }

                const isSelected = selectedSeat?.number === item.number;

                return (
                  <View style={{ opacity: matches ? 1 : 0.15 }}>
                    <SeatBox
                      seatLabel={item.label}
                      isBooked={item.booked}
                      isExpiring={item.isExpiring}
                      isSelected={isSelected}
                      onPress={() => matches && setSelectedSeat(item)}
                    />
                  </View>
                );
              }}
            />

            {/* ── LEGEND ── */}
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#0F6E56' }]} />
                <Text style={s.legendText}>Occupied</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#E8F5E0', borderColor: '#0F6E56', borderWidth: 1 }]} />
                <Text style={s.legendText}>Free</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#FFF3E8', borderColor: '#C2410C', borderWidth: 1 }]} />
                <Text style={s.legendText}>Expiring</Text>
              </View>
            </View>
          </View>

          {/* ── SELECTED SEAT DETAILS CARD ── */}
          {currentSelectedSeatDetails && (
            <View style={s.detailsCard}>
              <Text style={s.detailsHeader}>
                Seat {currentSelectedSeatDetails.label} — {currentSelectedSeatDetails.booked ? (currentSelectedSeatDetails.isExpiring ? 'Expiring Today' : 'Occupied') : 'Available'}
              </Text>
              
              <View style={s.detailsInfoBox}>
                {currentSelectedSeatDetails.booked ? (
                  <>
                    <TouchableOpacity 
                      style={s.studentInfoRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (currentSelectedSeatDetails.booking) {
                          const b = currentSelectedSeatDetails.booking;
                          router.push({
                            pathname: '/owner/student-profile',
                            params: {
                              id: b._id, 
                              name: b.student?.name || 'Student',
                              phone: b.student?.phone || '', 
                              seat: b.seat,
                              shift: b.shift, 
                              status: b.status,
                              endDate: b.endDate || '', 
                              fee: b.fee || 0,
                              gender: b.gender || '', 
                              address: b.address || '',
                              admissionDate: b.admissionDate || '',
                            }
                          });
                        }
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={s.studentName}>{currentSelectedSeatDetails.studentName}</Text>
                          <Ionicons name="chevron-forward" size={16} color={C.textGray} />
                        </View>
                        <Text style={s.studentSubtext}>
                          Seat {currentSelectedSeatDetails.label} • {currentSelectedSeatDetails.studentPlan} shift
                        </Text>
                      </View>
                      <View style={[s.badge, currentSelectedSeatDetails.isExpiring ? s.badgeExpiring : s.badgeActive]}>
                        <Text style={[s.badgeText, currentSelectedSeatDetails.isExpiring ? s.badgeTextExpiring : s.badgeTextActive]}>
                          {currentSelectedSeatDetails.isExpiring ? 'Expires today' : 'Active'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={s.actionBtnRow}>
                      <TouchableOpacity 
                        style={s.whatsappBtn} 
                        onPress={() => handleWhatsAppAlert(currentSelectedSeatDetails)}
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                        <Text style={s.whatsappBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={s.freeBtn} 
                        onPress={() => handleVacateSeat(currentSelectedSeatDetails)}
                      >
                        <Text style={s.freeBtnText}>Vacate Seat</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={s.vacantInfo}>
                    <Text style={s.vacantText}>This seat is currently available.</Text>
                    <TouchableOpacity 
                      style={s.assignBtn}
                      onPress={() => router.push(`/owner/tabs/students?seat=${currentSelectedSeatDetails.number}`)}
                    >
                      <Text style={s.assignBtnText}>Assign Student</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── SHIFT FILTER SECTION ── */}
          <View style={s.pricingSection}>
            <Text style={s.pricingTitle}>Filter by Shift</Text>
            <View style={s.pricingRow}>
              <TouchableOpacity 
                style={[s.priceCard, selectedShift === 'Morning' && s.priceCardActive]} 
                onPress={() => handleShiftSelect('Morning')}
              >
                <Text style={[s.priceLabel, selectedShift === 'Morning' && s.priceLabelActive]}>Morning</Text>
                <Text style={[s.priceValue, selectedShift === 'Morning' && s.priceValueActive]}>
                  {shiftCounts.morning}
                </Text>
                <Text style={[s.priceUnit, selectedShift === 'Morning' && s.priceUnitActive]}>students</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[s.priceCard, selectedShift === 'Evening' && s.priceCardActive]} 
                onPress={() => handleShiftSelect('Evening')}
              >
                <Text style={[s.priceLabel, selectedShift === 'Evening' && s.priceLabelActive]}>Evening</Text>
                <Text style={[s.priceValue, selectedShift === 'Evening' && s.priceValueActive]}>
                  {shiftCounts.evening}
                </Text>
                <Text style={[s.priceUnit, selectedShift === 'Evening' && s.priceUnitActive]}>students</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[s.priceCard, selectedShift === 'Full Day' && s.priceCardActive]} 
                onPress={() => handleShiftSelect('Full Day')}
              >
                <Text style={[s.priceLabel, selectedShift === 'Full Day' && s.priceLabelActive]}>Full Day</Text>
                <Text style={[s.priceValue, selectedShift === 'Full Day' && s.priceValueActive]}>
                  {shiftCounts.fullDay}
                </Text>
                <Text style={[s.priceUnit, selectedShift === 'Full Day' && s.priceUnitActive]}>students</Text>
              </TouchableOpacity>
            </View>
          </View>



        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: C.bg
  },

  // HEADER
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 15,
    backgroundColor: C.bg
  },
  backBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: C.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.primaryBorder,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: C.textDark
  },
  addBtn: { 
    backgroundColor: C.primary, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  addBtnText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 14 
  },

  // FILTERS
  filterScroll: {
    marginVertical: 10,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  filterPillActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  filterText: {
    fontSize: 14,
    color: C.textGray,
    fontWeight: '600',
  },
  filterTextActive: {
    color: C.primary,
    fontWeight: 'bold',
  },

  // GRID CARD
  gridCard: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  // LEGEND
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: C.textGray,
    fontWeight: '600',
  },

  // DETAILS CARD
  detailsCard: {
    backgroundColor: C.orangeLight,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.orangeBorder,
    marginBottom: 16,
  },
  detailsHeader: {
    fontSize: 13,
    color: C.orange,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  detailsInfoBox: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.orangeBorder,
  },
  studentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.textDark,
  },
  studentSubtext: {
    fontSize: 13,
    color: C.textGray,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: C.primaryLight,
  },
  badgeExpiring: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextActive: {
    color: C.primary,
  },
  badgeTextExpiring: {
    color: '#991B1B',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: C.orange,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  freeBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeBtnText: {
    color: C.textDark,
    fontWeight: 'bold',
    fontSize: 14,
  },
  vacantInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  vacantText: {
    color: C.textGray,
    fontSize: 14,
    marginBottom: 10,
  },
  assignBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  assignBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // SHIFT PRICING
  pricingSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.textDark,
    marginBottom: 10,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priceCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: C.border,
  },
  priceCardActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
    borderWidth: 1.5,
  },
  priceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: C.textGray,
    fontWeight: '600',
  },
  priceLabelActive: {
    color: C.primary,
    fontWeight: 'bold',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: C.textDark,
    marginTop: 4,
  },
  priceValueActive: {
    color: C.primary,
  },
  priceUnit: {
    fontSize: 11,
    color: C.textGray,
  },
  priceUnitActive: {
    color: C.primary,
  },

  // CAPACITY
  capacityCard: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  capacityLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: C.textGray,
    marginBottom: 8,
  },
  capacityInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  capacityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: C.bg,
    textAlign: 'center',
    color: C.textDark,
  },
  updateBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
