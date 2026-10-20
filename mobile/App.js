import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import LeaveScreen from './src/screens/LeaveScreen';
import AttendanceCameraScreen from './src/screens/AttendanceCameraScreen';
import { mobileApi, getBaseUrl, setServerHost } from './src/services/api';

function MainMobileApp() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraMode, setCameraMode] = useState(null); // 'clock-in' | 'clock-out' | null
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'leave'

  // Login form state
  const [identifier, setIdentifier] = useState('budi@hadirku.com');
  const [password, setPassword] = useState('password123');
  const [loggingIn, setLoggingIn] = useState(false);

  // Server IP config state
  const [currentBaseUrl, setCurrentBaseUrl] = useState('');
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [newHost, setNewHost] = useState('192.168.77.239');

  const refreshBaseUrl = async () => {
    const url = await getBaseUrl();
    setCurrentBaseUrl(url);
  };

  useEffect(() => {
    (async () => {
      try {
        await refreshBaseUrl();
        const savedToken = await AsyncStorage.getItem('user_token');
        const savedUser = await AsyncStorage.getItem('user_profile');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'NIP/Email dan password wajib diisi.');
      return;
    }

    try {
      setLoggingIn(true);
      const res = await mobileApi.login(identifier, password, 'DEV-PHONE-001');
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err) {
      Alert.alert(
        'Login Gagal',
        `${err.message || 'Kredensial salah.'}\n\nPastikan HP terhubung ke WiFi yang sama dengan komputer (${currentBaseUrl}).`
      );
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_profile');
    setToken(null);
    setUser(null);
  };

  const handleSaveHost = async () => {
    await setServerHost(newHost.trim());
    await refreshBaseUrl();
    setIsIpModalOpen(false);
    Alert.alert('Tersimpan', `Server API diarahkan ke: ${newHost.trim()}:5050`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  // Camera Selfie Fullscreen Screen
  if (cameraMode) {
    return (
      <AttendanceCameraScreen
        type={cameraMode}
        onComplete={() => setCameraMode(null)}
        onCancel={() => setCameraMode(null)}
      />
    );
  }

  // Login Screen
  if (!token) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar style="light" />
        <View style={styles.loginBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>HK</Text>
          </View>
          <Text style={styles.appName}>HadirKu Mobile</Text>
          <Text style={styles.appTagline}>Presensi Geofencing & Selfie Wajah</Text>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>NIP atau Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: EMP-001 atau budi@hadirku.com"
              placeholderTextColor="#64748b"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Kata Sandi</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.btnLogin}
            onPress={handleLogin}
            disabled={loggingIn}
          >
            {loggingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnLoginText}>Masuk ke Akun Karyawan</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnDemo}
            onPress={() => {
              setIdentifier('budi@hadirku.com');
              setPassword('password123');
            }}
          >
            <Text style={styles.btnDemoText}>✨ Gunakan Akun Karyawan Demo (Budi)</Text>
          </TouchableOpacity>

          {/* Server Target IP display & change */}
          <View style={styles.serverInfoBox}>
            <Text style={styles.serverInfoText}>Target Server: {currentBaseUrl}</Text>
            <TouchableOpacity onPress={() => setIsIpModalOpen(true)}>
              <Text style={styles.serverChangeText}>[Ubah IP]</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Change IP Modal */}
        <Modal visible={isIpModalOpen} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Ubah IP Server Komputer</Text>
              <Text style={styles.modalSub}>
                Masukkan IP laptop/komputer Anda (dilihat dari `ipconfig`). Port otomatis :5050.
              </Text>
              <TextInput
                style={styles.modalInput}
                value={newHost}
                onChangeText={setNewHost}
                placeholder="Contoh: 192.168.1.10"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
              />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalBtnCancel}
                  onPress={() => setIsIpModalOpen(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSave} onPress={handleSaveHost}>
                  <Text style={styles.modalBtnSaveText}>Simpan IP</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Main App Screen
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="light" />

      {/* Header Profile Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Halo, {user?.fullName || 'Karyawan'}</Text>
          <Text style={styles.subText}>{user?.nip} • {user?.department}</Text>
        </View>
        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Text style={styles.btnLogoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Body */}
      <View style={{ flex: 1 }}>
        {currentTab === 'home' ? (
          <HomeScreen
            onOpenCamera={(type) => setCameraMode(type)}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        ) : (
          <LeaveScreen />
        )}
      </View>

      {/* Modern Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navTab, currentTab === 'home' && styles.navTabActive]}
          onPress={() => setCurrentTab('home')}
        >
          <Text style={[styles.navIcon, currentTab === 'home' && styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navLabel, currentTab === 'home' && styles.navLabelActive]}>Presensi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, currentTab === 'leave' && styles.navTabActive]}
          onPress={() => setCurrentTab('leave')}
        >
          <Text style={[styles.navIcon, currentTab === 'leave' && styles.navIconActive]}>🏖️</Text>
          <Text style={[styles.navLabel, currentTab === 'leave' && styles.navLabelActive]}>Cuti & Izin</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Mobile App Runtime Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#090d16', padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: '#f43f5e', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            ⚠️ Error Aplikasi
          </Text>
          <Text style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 20 }}>
            {this.state.error?.message || String(this.state.error)}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#06b6d4', padding: 14, borderRadius: 12, alignItems: 'center' }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Muat Ulang Layar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <MainMobileApp />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, backgroundColor: '#090d16', justifyContent: 'center', alignItems: 'center' },
  loginContainer: { flex: 1, backgroundColor: '#090d16', justifyContent: 'center', padding: 24 },
  loginBox: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#06b6d4',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoText: { color: '#090d16', fontSize: 24, fontWeight: '900' },
  appName: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  appTagline: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  formGroup: { marginBottom: 14 },
  inputLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnLogin: {
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  btnLoginText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnDemo: { marginTop: 14, alignItems: 'center' },
  btnDemoText: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  serverInfoBox: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  serverInfoText: { color: '#64748b', fontSize: 10, fontFamily: 'monospace' },
  serverChangeText: { color: '#06b6d4', fontSize: 10, fontWeight: '700' },
  mainContainer: { flex: 1, backgroundColor: '#090d16' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  welcomeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  subText: { color: '#06b6d4', fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  btnLogout: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  btnLogoutText: { color: '#f43f5e', fontSize: 11, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  modalSub: { color: '#94a3b8', fontSize: 11, marginTop: 4, marginBottom: 14 },
  modalInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtnCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b' },
  modalBtnCancelText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  modalBtnSave: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#06b6d4' },
  modalBtnSaveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  navTabActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  navIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
    fontSize: 22,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#06b6d4',
    fontWeight: '800',
  },
});

