import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react';
import { api } from '../services/api';

export default function LeavesView() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState(null);
  const [rejectModalData, setRejectModalData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.getLeaves({ status: statusFilter });
      setLeaves(res.data);
    } catch (err) {
      console.error('Fetch leaves error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleApprove = async (leave) => {
    if (confirm(`Setujui pengajuan izin/cuti ${leave.user.fullName} (${leave.leaveType})?`)) {
      try {
        const res = await api.updateLeaveStatus(leave.id, 'approved');
        showNotification(res.message);
        fetchLeaves();
      } catch (err) {
        alert(err.message || 'Gagal menyetujui pengajuan cuti.');
      }
    }
  };

  const openRejectModal = (leave) => {
    setRejectModalData(leave);
    setRejectionReason('Kebutuhan operasional mendesak di departemen.');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalData) return;
    try {
      const res = await api.updateLeaveStatus(rejectModalData.id, 'rejected', rejectionReason);
      showNotification(res.message, 'warning');
      setRejectModalData(null);
      fetchLeaves();
    } catch (err) {
      alert(err.message || 'Gagal menolak pengajuan.');
    }
  };

  const formatLeaveType = (type) => {
    switch (type) {
      case 'annual':
        return 'Cuti Tahunan';
      case 'sick':
        return 'Sakit / Medis';
      case 'permit':
        return 'Izin Kepentingan Pribadi';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-card border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Persetujuan Izin & Cuti Karyawan</h2>
          <p className="text-xs text-slate-400 mt-1">
            Verifikasi pengajuan ketidakhadiran, tinjau surat dokter/lampiran, dan potong kuota cuti otomatis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="">Semua Status Pengajuan</option>
            <option value="pending">Menunggu Persetujuan (Pending)</option>
            <option value="approved">Disetujui (Approved)</option>
            <option value="rejected">Ditolak (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="rounded-2xl glass-card border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Tipe Ketidakhadiran</th>
                <th className="py-3 px-4">Rentang Tanggal</th>
                <th className="py-3 px-4">Alasan Karyawan</th>
                <th className="py-3 px-4">Lampiran Bukti</th>
                <th className="py-3 px-4">Status & Kuota</th>
                <th className="py-3 px-4 text-center">Aksi HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Memuat data perizinan...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Tidak ada pengajuan izin atau cuti yang ditemukan.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => {
                  const sDate = new Date(leave.startDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const eDate = new Date(leave.endDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={leave.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{leave.user.fullName}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{leave.user.nip} • {leave.user.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200">
                          {formatLeaveType(leave.leaveType)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {sDate} &ndash; {eDate}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-300">
                        <p className="line-clamp-2">{leave.reason}</p>
                        {leave.rejectionReason && (
                          <span className="text-[10px] text-rose-400 block mt-1">
                            Catatan HR: {leave.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {leave.attachmentPath ? (
                          <a
                            href={leave.attachmentPath}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-medium"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Buka Surat
                          </a>
                        ) : (
                          <span className="text-slate-600 text-[11px]">Tidak Ada</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              leave.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : leave.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {leave.status === 'pending'
                              ? 'Menunggu Review'
                              : leave.status === 'approved'
                              ? 'Disetujui'
                              : 'Ditolak'}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Sisa Hak Cuti: <b className="text-white">{leave.user.leaveQuota} hari</b>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {leave.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleApprove(leave)}
                              title="Setujui Pengajuan"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all cursor-pointer text-[11px] flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Setujui
                            </button>
                            <button
                              onClick={() => openRejectModal(leave)}
                              title="Tolak Pengajuan"
                              className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 font-semibold border border-rose-500/30 transition-all cursor-pointer text-[11px] flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            {leave.approver ? `Oleh: ${leave.approver.fullName}` : 'Selesai'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">
                Tolak Pengajuan Izin ({rejectModalData.user.fullName})
              </h3>
            </div>
            <form onSubmit={handleConfirmReject} className="p-4 space-y-3 text-xs">
              <label className="block text-slate-400 font-medium">Alasan Penolakan oleh HR *</label>
              <textarea
                required
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModalData(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
