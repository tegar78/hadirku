import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { mobileApi } from '../services/api';

export default function AttendanceCameraScreen({ type = 'clock-in', onComplete, onCancel }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      // 1. Request camera permission if not granted
      if (!permission?.granted) {
        await requestPermission();
      }

      // 2. Fetch high-accuracy GPS coordinates
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Ditolak', 'Akses lokasi GPS diperlukan untuk validasi radius absensi kantor.');
          setLocating(false);
          return;
        }

        // Try last known position first (fast)
        let curLoc = await Location.getLastKnownPositionAsync({}).catch(() => null);
        if (curLoc) {
          setLocation(curLoc);
          setLocating(false);
        }

        const freshLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);

        if (freshLoc) {
          setLocation(freshLoc);
        }
      } catch (err) {
        console.warn('GPS notice in camera screen:', err);
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'front' ? 'back' : 'front'));
  };

  // Fallback: Open native camera app built into the phone (100% reliable on all Android devices)
  const handleOpenNativeCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Kamera Dibutuhkan', 'Izinkan akses kamera untuk mengambil foto selfie.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setCapturedPhoto({
          uri: asset.uri,
          base64: asset.base64,
        });
      }
    } catch (err) {
      Alert.alert('Gagal Membuka Kamera', err.message || 'Tidak dapat membuka kamera HP.');
    }
  };

  const handleCaptureFromCameraView = async () => {
    if (!cameraRef.current) return;

    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });

      if (photo) {
        setCapturedPhoto({
          uri: photo.uri,
          base64: photo.base64,
        });
      }
    } catch (err) {
      console.warn('Capture error:', err);
      Alert.alert('Gagal Mengambil Foto', 'Gunakan tombol "Kamera Bawaan HP" di atas untuk mengambil selfie.');
    } finally {
      setCapturing(false);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!capturedPhoto || !capturedPhoto.base64) {
      Alert.alert('Foto Belum Ada', 'Silakan ambil foto selfie wajah terlebih dahulu.');
      return;
    }

    if (!location) {
      Alert.alert('Menunggu GPS', 'Sinyal GPS belum terkunci. Pastikan fitur Lokasi (GPS) HP sudah aktif.');
      return;
    }

    if (location.mocked) {
      Alert.alert(
        'Fake GPS Terdeteksi!',
        'Sistem mendeteksi fitur Mock Location / Fake GPS aktif. Absensi dibatalkan demi keamanan.'
      );
      return;
    }

    try {
      setCapturing(true);
      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        isMockLocation: location.mocked || false,
        photoBase64: `data:image/jpeg;base64,${capturedPhoto.base64}`,
      };

      let response;
      if (type === 'clock-in') {
        response = await mobileApi.clockIn(payload);
      } else {
        response = await mobileApi.clockOut(payload);
      }

      Alert.alert('Berhasil!', response.message || 'Absensi kehadiran berhasil tercatat.', [
        { text: 'OK', onPress: onComplete },
      ]);
    } catch (err) {
      Alert.alert('Absensi Gagal', err.message || 'Terjadi kesalahan saat memproses absensi.');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#06b6d4" />
        <Text style={styles.textLoading}>Memeriksa izin kamera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.textWarning}>HadirKu memerlukan izin kamera depan untuk selfie absensi.</Text>
        <TouchableOpacity style={styles.btnAction} onPress={requestPermission}>
          <Text style={styles.btnText}>Izinkan Akses Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnCancel, { marginTop: 15 }]} onPress={onCancel}>
          <Text style={styles.btnCancelText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preview Mode when photo is taken
  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImage} resizeMode="cover" />
        <View style={styles.previewOverlay}>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Konfirmasi Foto Selfie</Text>
            <Text style={styles.headerSubtitle}>Pastikan wajah Anda terlihat jelas</Text>
          </View>

          <View style={styles.previewFooter}>
            <TouchableOpacity
              style={styles.btnRetake}
              onPress={() => setCapturedPhoto(null)}
              disabled={capturing}
            >
              <Text style={styles.btnRetakeText}>🔄 Foto Ulang</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSubmit}
              onPress={handleSubmitAttendance}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSubmitText}>✅ Kirim Absen Sekarang</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        ref={cameraRef}
        mirror={facing === 'front'}
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* Overlay uses absolute positioning on top of CameraView */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Header */}
        <View style={styles.headerBar}>
          <View style={styles.topActionsRow}>
            <TouchableOpacity style={styles.pillButton} onPress={toggleCameraFacing}>
              <Text style={styles.pillButtonText}>🔄 Putar ({facing === 'front' ? 'Depan' : 'Belakang'})</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pillButtonAccent} onPress={handleOpenNativeCamera}>
              <Text style={styles.pillButtonAccentText}>📷 Buka Kamera Bawaan HP</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>
            {type === 'clock-in' ? '📸 Selfie Absen Masuk' : '📸 Selfie Absen Pulang'}
          </Text>
          <Text style={styles.headerSubtitle}>Posisikan wajah Anda tepat di dalam bingkai</Text>
        </View>

        {/* Face Oval Framing Guide with Tap-to-Open Native Camera Button */}
        <View style={styles.faceOval} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.centerCameraBtn}
            onPress={handleOpenNativeCamera}
          >
            <Text style={{ fontSize: 28, marginBottom: 4 }}>📷</Text>
            <Text style={styles.centerCameraBtnText}>Buka Kamera Bawaan HP</Text>
            <Text style={styles.centerCameraBtnSub}>Ketuk di sini jika layar pratinjau gelap</Text>
          </TouchableOpacity>
        </View>

        {/* GPS status banner */}
        <View style={styles.gpsBanner}>
          <Text style={styles.gpsText}>
            {locating
              ? '📍 Mencari koordinat GPS...'
              : location
              ? `📍 GPS Terkunci: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
              : '❌ GPS Tidak Tersedia'}
          </Text>
        </View>

        {/* Footer Controls */}
        <View style={styles.footerBar}>
          <TouchableOpacity style={styles.btnCancel} onPress={onCancel} disabled={capturing}>
            <Text style={styles.btnCancelText}>Batal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSnap, (capturing || locating) && styles.btnDisabled]}
            onPress={handleCaptureFromCameraView}
            disabled={capturing || locating}
          >
            {capturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnSnapInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnCancel} onPress={handleOpenNativeCamera}>
            <Text style={{ color: '#06b6d4', fontSize: 13, fontWeight: '700' }}>Kamera HP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  textLoading: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 45,
    paddingBottom: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pillButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillButtonText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  pillButtonAccent: {
    backgroundColor: 'rgba(6, 182, 212, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillButtonAccentText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  headerBar: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  faceOval: {
    width: 250,
    height: 320,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#06b6d4',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCameraBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#06b6d4',
    maxWidth: 200,
  },
  centerCameraBtnText: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerCameraBtnSub: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },
  gpsBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  gpsText: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '700',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
  },
  btnCancel: {
    padding: 10,
    minWidth: 60,
  },
  btnCancelText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnSnap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  btnSnapInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#06b6d4',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  textWarning: {
    color: '#f87171',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  btnAction: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  // Preview Mode
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  previewFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  btnRetake: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnRetakeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  btnSubmit: {
    flex: 2,
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});
