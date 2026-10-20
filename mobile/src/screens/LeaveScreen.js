import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { mobileApi } from '../services/api';

export default function LeaveScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveQuota, setLeaveQuota] = useState(12);
  const [leaves, setLeaves] = useState([]);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState('sick'); // 'sick' | 'annual' | 'permit'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState(null); // { uri, base64 }

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getMyLeaves();
      if (res.data) {
        setLeaveQuota(res.data.leaveQuota ?? 12);
        setLeaves(res.data.leaves || []);
      }
    } catch (err) {
      console.error('Fetch leaves error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setTodayDates = (daysCount = 1) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    setStartDate(todayStr);

    if (daysCount === 1) {
      setEndDate(todayStr);
    } else {
      const end = new Date(today);
      end.setDate(end.getDate() + (daysCount - 1));
      const endY = end.getFullYear();
      const endM = String(end.getMonth() + 1).padStart(2, '0');
      const endD = String(end.getDate()).padStart(2, '0');
      setEndDate(`${endY}-${endM}-${endD}`);
    }
  };

  const handlePickDocument = async () => {
    Alert.alert('Pilih Dokumen Pendukung', 'Ambil foto surat dokter/keterangan:', [
      {
        text: '📷 Kamera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Izin Ditolak', 'Akses kamera dibutuhkan.');
            return;
          }
          const res = await ImagePicker.launchCameraAsync({
            quality: 0.5,
            base64: true,
          });
          if (!res.canceled && res.assets && res.assets[0]) {
            setAttachment({
              uri: res.assets[0].uri,
              base64: res.assets[0].base64,
            });
          }
        },
      },
      {
        text: '🖼️ Galeri Foto',
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.5,
            base64: true,
          });
          if (!res.canceled && res.assets && res.assets[0]) {
            setAttachment({
              uri: res.assets[0].uri,
              base64: res.assets[0].base64,
            });
          }
        },
      },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const handleSubmitLeave = async () => {
    if (!startDate.trim() || !endDate.trim() || !reason.trim()) {
      Alert.alert('Data Belum Lengkap', 'Tanggal mulai, tanggal selesai, dan alasan wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        leaveType,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        reason: reason.trim(),
        attachmentBase64: attachment?.base64 ? `data:image/jpeg;base64,${attachment.base64}` : null,
      };

      const res = await mobileApi.submitLeave(payload);
      Alert.alert('Sukses!', res.message || 'Pengajuan izin/cuti berhasil dikirim.');
      setIsModalOpen(false);
      setReason('');
      setAttachment(null);
      loadLeaves();
    } catch (err) {
      Alert.alert('Gagal Mengajukan', err.message || 'Terjadi kesalahan saat mengirim pengajuan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveTypeBadge = (type) => {
    switch (type) {
      case 'annual':
        return { label: '🏖️ Cuti Tahunan', color: '#06b6d4' };
      case 'sick':
        return { label: '🩺 Izin Sakit', color: '#f59e0b' };
      case 'permit':
        return { label: '📝 Izin Urusan Pribadi', color: '#a855f7' };
      default:
        return { label: 'Izin', color: '#94a3b8' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { label: '✅ Disetujui HR', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' };
      case 'rejected':
        return { label: '❌ Ditolak', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' };
      default:
        return { label: '⏳ Menunggu Persetujuan', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Quota and Action Card */}
      <View style={styles.quotaCard}>
        <View style={styles.quotaInfo}>
          <Text style={styles.quotaLabel}>Sisa Kuota Cuti Tahunan</Text>
          <Text style={styles.quotaValue}>{leaveQuota} <Text style={styles.quotaUnit}>Hari</Text></Text>
          <Text style={styles.quotaSub}>Berlaku untuk periode tahun berjalan</Text>
        </View>

        <TouchableOpacity
          style={styles.btnOpenModal}
          onPress={() => {
            setTodayDates(1);
            setIsModalOpen(true);
          }}
        >
          <Text style={styles.btnOpenModalText}>➕ Ajukan Izin / Cuti</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Riwayat Pengajuan Cuti & Izin</Text>

      {/* Leave List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLeaves} tintColor="#06b6d4" />}
      >
        {loading && leaves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator color="#06b6d4" />
            <Text style={styles.emptyText}>Memuat data pengajuan cuti...</Text>
          </View>
        ) : leaves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📄</Text>
            <Text style={styles.emptyTitle}>Belum Ada Pengajuan</Text>
            <Text style={styles.emptyText}>
              Anda belum pernah mengajukan cuti atau izin sakit. Ketuk tombol di atas untuk mengajukan.
            </Text>
          </View>
        ) : (
          leaves.map((item) => {
            const typeInfo = getLeaveTypeBadge(item.leaveType);
            const statusInfo = getStatusBadge(item.status);
            const startFmt = new Date(item.startDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const endFmt = new Date(item.endDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <View key={item.id} style={styles.leaveCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.typeBadge, { borderColor: typeInfo.color }]}>
                    <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                  </View>
                </View>

                <View style={styles.cardDateBox}>
                  <Text style={styles.dateRangeText}>
                    📅 {startFmt} {startFmt !== endFmt ? `s/d ${endFmt}` : ''}
                  </Text>
                </View>

                <Text style={styles.reasonText}>"{item.reason}"</Text>

                {item.status === 'rejected' && item.rejectionReason && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionTitle}>Alasan Penolakan HR:</Text>
                    <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
                  </View>
                )}

                {item.attachmentPath && (
                  <View style={styles.attachmentNotice}>
                    <Text style={styles.attachmentNoticeText}>📎 Lampiran Surat Dokter / Dokumen terlampir</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Form Pengajuan Cuti / Izin */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Form Pengajuan Izin / Cuti</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Pilihan Tipe Cuti */}
              <Text style={styles.inputLabel}>Pilih Kategori Izin *</Text>
              <View style={styles.typeSelectorRow}>
                {[
                  { id: 'sick', label: '🩺 Sakit', sub: 'Surat dokter' },
                  { id: 'annual', label: '🏖️ Cuti', sub: 'Potong kuota' },
                  { id: 'permit', label: '📝 Izin', sub: 'Keperluan pribadi' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeBtn, leaveType === t.id && styles.typeBtnActive]}
                    onPress={() => setLeaveType(t.id)}
                  >
                    <Text style={[styles.typeBtnText, leaveType === t.id && styles.typeBtnTextActive]}>
                      {t.label}
                    </Text>
                    <Text style={styles.typeBtnSub}>{t.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Preset Tanggal */}
              <Text style={styles.inputLabel}>Preset Durasi Cepat:</Text>
              <View style={styles.presetRow}>
                <TouchableOpacity style={styles.presetBtn} onPress={() => setTodayDates(1)}>
                  <Text style={styles.presetBtnText}>Hari Ini (1 Hari)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetBtn} onPress={() => setTodayDates(2)}>
                  <Text style={styles.presetBtnText}>2 Hari</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetBtn} onPress={() => setTodayDates(3)}>
                  <Text style={styles.presetBtnText}>3 Hari</Text>
                </TouchableOpacity>
              </View>

              {/* Tanggal Input */}
              <View style={styles.dateInputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Mulai (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-10-19"
                    placeholderTextColor="#64748b"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Selesai (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-10-19"
                    placeholderTextColor="#64748b"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>

              {/* Alasan */}
              <Text style={styles.inputLabel}>Alasan / Keterangan Izin *</Text>
              <TextInput
                style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Contoh: Demam flu tinggi, istirahat dokter..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
              />

              {/* Lampiran Dokumen */}
              <Text style={styles.inputLabel}>Lampiran Dokumen / Surat Dokter (Opsional)</Text>
              <TouchableOpacity style={styles.uploadBox} onPress={handlePickDocument}>
                {attachment ? (
                  <View style={{ alignItems: 'center' }}>
                    <Image source={{ uri: attachment.uri }} style={styles.attachmentPreview} />
                    <Text style={styles.uploadSubText}>Ketuk untuk ganti foto</Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>📎</Text>
                    <Text style={styles.uploadText}>Ambil Foto / Pilih dari Galeri</Text>
                    <Text style={styles.uploadSubText}>Format JPG/PNG untuk surat dokter atau bukti izin</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.btnSubmit, submitting && styles.btnDisabled]}
                onPress={handleSubmitLeave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnSubmitText}>🚀 Kirim Pengajuan Izin/Cuti</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    padding: 16,
  },
  quotaCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quotaInfo: {
    flex: 1,
  },
  quotaLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  quotaValue: {
    color: '#06b6d4',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  quotaUnit: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  quotaSub: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  btnOpenModal: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#06b6d4',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  btnOpenModalText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  leaveCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDateBox: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dateRangeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  reasonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  rejectionBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rejectionTitle: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  rejectionText: {
    color: '#fca5a5',
    fontSize: 11,
    marginTop: 2,
  },
  attachmentNotice: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  attachmentNoticeText: {
    color: '#06b6d4',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    color: '#94a3b8',
    fontSize: 20,
    padding: 4,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  typeBtnActive: {
    borderColor: '#06b6d4',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  typeBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: '#06b6d4',
  },
  typeBtnSub: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  presetBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presetBtnText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  uploadBox: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadText: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadSubText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  attachmentPreview: {
    width: 140,
    height: 80,
    borderRadius: 10,
    marginBottom: 6,
  },
  btnSubmit: {
    backgroundColor: '#06b6d4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#06b6d4',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
