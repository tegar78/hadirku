import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Search,
  Camera,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import SelfieModal from '../components/SelfieModal';

export default function ReportsView() {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const fetchRecap = async () => {
    try {
      setLoading(true);
      const res = await api.getAttendanceRecap({
        startDate,
        endDate,
        department,
        status,
        search,
      });
      setRecords(res.data);
    } catch (err) {
      console.error('Fetch recap error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecap();
  }, [startDate, endDate, department, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecap();
  };

  // Export to Excel XLSX
  const exportToExcel = () => {
    if (records.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const excelData = records.map((r, idx) => ({
      No: idx + 1,
      Tanggal: new Date(r.attendanceDate).toLocaleDateString('id-ID'),
      NIP: r.user.nip,
      'Nama Karyawan': r.user.fullName,
      Departemen: r.user.department,
      Jabatan: r.user.position,
      'Clock In': r.clockInTime ? new Date(r.clockInTime).toLocaleTimeString('id-ID') : '-',
      'Clock Out': r.clockOutTime ? new Date(r.clockOutTime).toLocaleTimeString('id-ID') : '-',
      'Jarak GPS (Meter)': r.distanceInMeters || '-',
      Status:
        r.status === 'on_time'
          ? 'Tepat Waktu'
          : r.status === 'late'
          ? 'Terlambat'
          : r.status === 'leave'
          ? 'Izin / Cuti'
          : 'Alpha',
      Catatan: r.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Kehadiran');
    XLSX.writeFile(
      workbook,
      `Rekap_Absensi_HadirKu_${startDate}_sd_${endDate}.xlsx`
    );
  };

  // Print Friendly Report
  const handlePrint = () => {
    window.print();
  };

  const departmentsList = [
    'IT Engineering',
    'Human Resources',
    'Operations',
    'Finance & Accounting',
    'Marketing & Sales',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="p-5 rounded-2xl glass-card border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Laporan Rekapitulasi Kehadiran Karyawan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ekspor data log presensi harian, keterlambatan, dan jarak GPS ke Excel (.xlsx) untuk penggajian (*Payroll*).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            Cetak / PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-2xl glass-card border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs print:hidden">
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Dari Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Departemen</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">Semua Departemen</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Status Kehadiran</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">Semua Status</option>
            <option value="on_time">Tepat Waktu (On Time)</option>
            <option value="late">Terlambat (Late)</option>
            <option value="leave">Cuti / Izin (Leave)</option>
            <option value="absent">Alpha / Tidak Masuk</option>
          </select>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
          Total Baris Data: <b className="text-white font-mono">{records.length}</b>
        </span>
        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Tepat Waktu: <b className="font-mono">{records.filter((r) => r.status === 'on_time').length}</b>
        </span>
        <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Terlambat: <b className="font-mono">{records.filter((r) => r.status === 'late').length}</b>
        </span>
        <span className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          Cuti / Izin: <b className="font-mono">{records.filter((r) => r.status === 'leave').length}</b>
        </span>
      </div>

      {/* Report Table */}
      <div className="rounded-2xl glass-card border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Departemen</th>
                <th className="py-3 px-4">Clock-In</th>
                <th className="py-3 px-4">Clock-Out</th>
                <th className="py-3 px-4">Jarak GPS</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-center print:hidden">Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">
                    Memuat rekapitulasi kehadiran...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">
                    Tidak ada rekaman kehadiran untuk filter tanggal ini.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const dateStr = new Date(r.attendanceDate).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-200">{dateStr}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{r.user.fullName}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{r.user.nip}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{r.user.department}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {r.clockInTime
                          ? new Date(r.clockInTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-400">
                        {r.clockOutTime
                          ? new Date(r.clockOutTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {r.distanceInMeters ? (
                          <span className="text-cyan-400">{r.distanceInMeters} m</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'on_time'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : r.status === 'late'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}
                        >
                          {r.status === 'on_time'
                            ? 'Tepat Waktu'
                            : r.status === 'late'
                            ? 'Terlambat'
                            : r.status === 'leave'
                            ? 'Izin / Cuti'
                            : r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {r.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-center print:hidden">
                        {(r.photoInPath || r.photoOutPath) ? (
                          <button
                            onClick={() => setSelectedAttendance(r)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-[11px] transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Foto
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

      {/* Selfie Modal */}
      {selectedAttendance && (
        <SelfieModal
          attendance={selectedAttendance}
          onClose={() => setSelectedAttendance(null)}
        />
      )}
    </div>
  );
}
