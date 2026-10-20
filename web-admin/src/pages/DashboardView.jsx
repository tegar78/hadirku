import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  ClockAlert,
  CalendarOff,
  UserX,
  MapPin,
  RefreshCw,
  Camera,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import SelfieModal from '../components/SelfieModal';

export default function DashboardView({ onNavigateTo }) {
  const [stats, setStats] = useState(null);
  const [liveRecords, setLiveRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, liveRes] = await Promise.all([
        api.getDashboardStats(),
        api.getTodayMonitoring(),
      ]);
      setStats(statsRes.data);
      setLiveRecords(liveRes.data.records);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds for live monitoring
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredRecords = liveRecords.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.nip.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-card border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Dashboard Pemantauan Kehadiran Realtime
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Data kehadiran karyawan hari ini terekam menggunakan koordinat Geofencing & Biometrik Wajah.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Perbarui Data
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Active Employees */}
        <div className="p-4 rounded-2xl glass-card border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Karyawan</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {stats?.totalActiveEmployees || 0}
            </h3>
            <span className="text-[10px] text-slate-400">Status Aktif Bekerja</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Hadir Tepat Waktu */}
        <div className="p-4 rounded-2xl glass-card border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tepat Waktu</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {stats?.onTimeToday || 0}
            </h3>
            <span className="text-[10px] text-emerald-400/80">Sesuai Jadwal Shift</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Terlambat */}
        <div className="p-4 rounded-2xl glass-card border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Terlambat</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">
              {stats?.lateToday || 0}
            </h3>
            <span className="text-[10px] text-amber-400/80">Lewat Toleransi</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ClockAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Pengajuan Cuti Pending */}
        <div className="p-4 rounded-2xl glass-card border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Izin / Cuti</p>
            <h3 className="text-2xl font-black text-cyan-400 mt-1">
              {stats?.pendingLeaves || 0}
            </h3>
            <span className="text-[10px] text-cyan-400/80">Menunggu Persetujuan</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <CalendarOff className="w-6 h-6" />
          </div>
        </div>

        {/* Belum Absen */}
        <div className="p-4 rounded-2xl glass-card border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Belum Hadir</p>
            <h3 className="text-2xl font-black text-rose-400 mt-1">
              {stats?.notPresentToday || 0}
            </h3>
            <span className="text-[10px] text-rose-400/80">Belum Clock-In</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Office Quick Status Widget */}
      {stats?.office && (
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{stats.office.officeName}</p>
              <p className="text-slate-400">
                Pusat Geofence: {stats.office.latitude.toFixed(4)}, {stats.office.longitude.toFixed(4)} • Batas Radius:{' '}
                <span className="text-cyan-400 font-semibold">{stats.office.radiusMeters} meter</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTo('office')}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium transition-all cursor-pointer text-xs"
          >
            Ubah Pengaturan Kantor &rarr;
          </button>
        </div>
      )}

      {/* Realtime Attendance Table */}
      <div className="rounded-2xl glass-card border-slate-800 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-sm">Status Kehadiran Hari Ini</h3>
            <p className="text-xs text-slate-400">Daftar absensi langsung dari aplikasi mobile karyawan</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIP, divisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Departemen & Posisi</th>
                <th className="py-3 px-4">Clock-In</th>
                <th className="py-3 px-4">Clock-Out</th>
                <th className="py-3 px-4">Jarak GPS</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Foto Biometrik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Tidak ada data kehadiran yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const att = item.attendance;
                  const clockInFormatted = att?.clockInTime
                    ? new Date(att.clockInTime).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '-';
                  const clockOutFormatted = att?.clockOutTime
                    ? new Date(att.clockOutTime).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '-';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{item.fullName}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{item.nip}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-300 font-medium">{item.department}</div>
                        <div className="text-[11px] text-slate-400">{item.position}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        {clockInFormatted}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        {clockOutFormatted}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {att?.distanceInMeters ? (
                          <span className="text-cyan-400 font-semibold">{att.distanceInMeters} m</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            !att
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : att.status === 'on_time'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : att.status === 'late'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}
                        >
                          {item.statusDisplay}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {att ? (
                          <button
                            onClick={() => setSelectedAttendance(att)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 transition-all text-[11px] font-medium cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Lihat
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
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

      {/* Selfie Verification Modal */}
      {selectedAttendance && (
        <SelfieModal
          attendance={selectedAttendance}
          onClose={() => setSelectedAttendance(null)}
        />
      )}
    </div>
  );
}
