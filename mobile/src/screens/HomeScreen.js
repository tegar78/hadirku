import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { mobileApi } from '../services/api';

export default function HomeScreen({ onOpenCamera, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [time, setTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState(null);
  const [distanceToOffice, setDistanceToOffice] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getTodayStatus();
      setData(res.data);

      // Check current GPS location gracefully in its own block
      try {
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (isEnabled) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            // Try last known position first (instant & reliable)
            let cur = await Location.getLastKnownPositionAsync({}).catch(() => null);
            if (!cur) {
              cur = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              }).catch(() => null);
            }

            if (cur) {
              setUserLocation(cur);
              if (res.data?.office) {
                const dist = calculateHaversine(
                  cur.coords.latitude,
                  cur.coords.longitude,
                  res.data.office.latitude,
                  res.data.office.longitude
                );
                setDistanceToOffice(dist);
              }
            }
          }
        }
      } catch (locErr) {
        // GPS fix may be delayed indoors, handled gracefully
      }
    } catch (err) {
      console.error('Home load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const att = data?.attendance;
  const shift = data?.shift;
  const office = data?.office;
  const isClockedIn = !!att?.clockInTime;
  const isClockedOut = !!att?.clockOutTime;

  const isWithinRadius =
    distanceToOffice !== null && office
      ? distanceToOffice <= office.radiusMeters
      : false;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStatus} tintColor="#06b6d4" />}
    >
      {/* Live Clock Card */}
      <View style={styles.clockCard}>
        <Text style={styles.clockTime}>
          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>
        <Text style={styles.clockDate}>
          {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        <View style={styles.shiftBadge}>
          <Text style={styles.shiftText}>
            📅 {shift ? shift.shiftName : 'Shift Reguler (08:00 - 17:00)'}
          </Text>
        </View>
      </View>

      {/* Geofencing Office Distance Radar */}
      <View style={[styles.radarCard, isWithinRadius ? styles.radarIn : styles.radarOut]}>
        <Text style={styles.radarTitle}>
          {isWithinRadius ? '📍 Di Dalam Area Kantor' : '⚠️ Di Luar Area Kantor'}
        </Text>
        <Text style={styles.radarDistance}>
          {distanceToOffice !== null
            ? `Jarak ke ${office?.officeName || 'Kantor'}: ${distanceToOffice} m`
            : 'Menghitung jarak GPS...'}
        </Text>
        <Text style={styles.radarRadius}>
          Radius Toleransi Absensi: {office?.radiusMeters || 50} meter
        </Text>
        {userLocation?.coords && (
          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
            🛰️ Koordinat HP: {userLocation.coords.latitude.toFixed(5)}, {userLocation.coords.longitude.toFixed(5)}
          </Text>
        )}
      </View>

      {/* Today Attendance Log Summary */}
      <View style={styles.logCard}>
        <Text style={styles.cardHeader}>Status Presensi Hari Ini</Text>
        <View style={styles.logRow}>
          <View style={styles.logBox}>
            <Text style={styles.logLabel}>Clock-In (Masuk)</Text>
            <Text style={styles.logTime}>
              {att?.clockInTime
                ? new Date(att.clockInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </Text>
            <Text style={styles.logStatus}>
              {att?.status === 'on_time'
                ? '✅ Tepat Waktu'
                : att?.status === 'late'
                ? '⚠️ Terlambat'
                : 'Belum Absen'}
            </Text>
          </View>

          <View style={styles.logBox}>
            <Text style={styles.logLabel}>Clock-Out (Pulang)</Text>
            <Text style={styles.logTime}>
              {att?.clockOutTime
                ? new Date(att.clockOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </Text>
            <Text style={styles.logStatus}>
              {isClockedOut ? '✅ Selesai' : 'Belum Pulang'}
            </Text>
          </View>
        </View>
      </View>

      {/* Primary Action Buttons */}
      <View style={styles.actionGrid}>
        {!isClockedIn ? (
          <TouchableOpacity
            style={[styles.btnClockIn, !isWithinRadius && styles.btnWarning]}
            onPress={() => onOpenCamera('clock-in')}
          >
            <Text style={styles.btnActionTitle}>📸 ABSEN MASUK</Text>
            <Text style={styles.btnActionSub}>Selfie & Cek Geofence GPS</Text>
          </TouchableOpacity>
        ) : !isClockedOut ? (
          <TouchableOpacity
            style={[styles.btnClockOut, !isWithinRadius && styles.btnWarning]}
            onPress={() => onOpenCamera('clock-out')}
          >
            <Text style={styles.btnActionTitle}>🏠 ABSEN PULANG</Text>
            <Text style={styles.btnActionSub}>Selfie Kepulangan Kantor</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedCard}>
            <Text style={styles.completedTitle}>🎉 Absensi Hari Ini Lengkap!</Text>
            <Text style={styles.completedSub}>Terima kasih atas dedikasi dan kerja keras Anda hari ini.</Text>
          </View>
        )}
      </View>

      {/* Employee Quick Services Menu */}
      <View style={styles.servicesSection}>
        <Text style={styles.servicesHeader}>Layanan Mandiri Karyawan</Text>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => onNavigate && onNavigate('leave')}
        >
          <View style={styles.serviceIconBox}>
            <Text style={{ fontSize: 24 }}>🏖️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceTitle}>Pengajuan Cuti & Izin Sakit</Text>
            <Text style={styles.serviceDesc}>
              Cuti tahunan, izin sakit surat dokter, atau izin keperluan pribadi
            </Text>
          </View>
          <Text style={styles.serviceArrow}>➔</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 20 },
  clockCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  clockTime: { fontSize: 38, fontWeight: '900', color: '#06b6d4', letterSpacing: 1 },
  clockDate: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  shiftBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  shiftText: { color: '#06b6d4', fontSize: 11, fontWeight: '700' },
  radarCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  radarIn: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  radarOut: { backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)' },
  radarTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  radarDistance: { fontSize: 13, color: '#e2e8f0', marginTop: 4, fontWeight: '600' },
  radarRadius: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  logCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 14 },
  logRow: { flexDirection: 'row', gap: 12 },
  logBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  logLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  logTime: { fontSize: 20, fontWeight: '800', color: '#fff', marginVertical: 4 },
  logStatus: { fontSize: 11, fontWeight: '600', color: '#38bdf8' },
  actionGrid: { marginBottom: 30 },
  btnClockIn: {
    backgroundColor: '#06b6d4',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  btnClockOut: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  btnWarning: { opacity: 0.85 },
  btnActionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  btnActionSub: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, marginTop: 2 },
  completedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  completedTitle: { color: '#10b981', fontSize: 16, fontWeight: '800' },
  completedSub: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 4 },
  servicesSection: {
    marginTop: 6,
    marginBottom: 40,
  },
  servicesHeader: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  serviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  serviceTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  serviceDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  serviceArrow: {
    color: '#06b6d4',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
});

