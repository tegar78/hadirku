import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, Calendar, CheckCircle, AlertCircle, X, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export default function ShiftsView() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    shiftName: '',
    startTime: '08:00:00',
    endTime: '17:00:00',
    lateToleranceMinutes: 15,
  });
  const [assignData, setAssignData] = useState({
    userId: '',
    shiftId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [notification, setNotification] = useState(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shiftRes, empRes] = await Promise.all([
        api.getShifts(),
        api.getEmployees(),
      ]);
      setShifts(shiftRes.data);
      setEmployees(empRes.data);
      if (empRes.data.length > 0 && !assignData.userId) {
        setAssignData((prev) => ({
          ...prev,
          userId: empRes.data[0].id,
          shiftId: shiftRes.data[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error('Fetch shifts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingShift(null);
    setFormData({
      shiftName: '',
      startTime: '08:00:00',
      endTime: '17:00:00',
      lateToleranceMinutes: 15,
    });
    setIsShiftModalOpen(true);
  };

  const openEditModal = (shift) => {
    setEditingShift(shift);
    setFormData({
      shiftName: shift.shiftName,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateToleranceMinutes: shift.lateToleranceMinutes,
    });
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    try {
      if (editingShift) {
        await api.updateShift(editingShift.id, formData);
        showNotification(`Shift "${formData.shiftName}" berhasil diperbarui.`);
      } else {
        await api.createShift(formData);
        showNotification(`Shift "${formData.shiftName}" berhasil dibuat.`);
      }
      setIsShiftModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan shift.');
    }
  };

  const handleDeleteShift = async (shift) => {
    if (confirm(`Hapus master shift "${shift.shiftName}"?`)) {
      try {
        await api.deleteShift(shift.id);
        showNotification('Shift berhasil dihapus.');
        fetchData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus shift.');
      }
    }
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    try {
      await api.assignShift(assignData);
      showNotification('Jadwal shift berhasil ditugaskan ke karyawan.');
      setIsAssignModalOpen(false);
    } catch (err) {
      alert(err.message || 'Gagal menugaskan jadwal shift.');
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-card border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Manajemen Jam Kerja & Shift</h2>
          <p className="text-xs text-slate-400 mt-1">
            Atur aturan jam masuk, jam pulang, toleransi menit keterlambatan, dan penugasan jadwal karyawan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-cyan-400" />
            Tugaskan Jadwal
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-900/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Master Shift
          </button>
        </div>
      </div>

      {/* Shifts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((shift) => (
          <div key={shift.id} className="p-5 rounded-2xl glass-card border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{shift.shiftName}</h3>
                <span className="text-[11px] text-cyan-400 font-mono">ID Shift: #{shift.id}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(shift)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteShift(shift)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Jam Masuk</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{shift.startTime}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Jam Pulang</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">{shift.endTime}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Toleransi Keterlambatan</span>
                <span className="font-medium text-amber-300">
                  {shift.lateToleranceMinutes} Menit dari Jam Masuk
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Jadwal Terdaftar:</span>
              <span className="font-semibold text-white">{shift._count?.userSchedules || 0} Penugasan</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Shift Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingShift ? 'Edit Master Shift' : 'Tambah Master Shift Baru'}
              </h3>
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nama Shift *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shift Reguler (08:00 - 17:00)"
                  value={formData.shiftName}
                  onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Jam Masuk *</label>
                  <input
                    type="text"
                    required
                    placeholder="08:00:00"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Jam Pulang *</label>
                  <input
                    type="text"
                    required
                    placeholder="17:00:00"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Toleransi Keterlambatan (Menit)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.lateToleranceMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, lateToleranceMinutes: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Karyawan yang absen lewat dari waktu ini akan otomatis berstatus Terlambat (*Late*).
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl"
                >
                  Simpan Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Tugaskan Shift ke Karyawan</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignShift} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Pilih Karyawan *</label>
                <select
                  value={assignData.userId}
                  onChange={(e) => setAssignData({ ...assignData, userId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.nip} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Pilih Master Shift *</label>
                <select
                  value={assignData.shiftId}
                  onChange={(e) => setAssignData({ ...assignData, shiftId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shiftName} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tanggal Efektif *</label>
                <input
                  type="date"
                  required
                  value={assignData.effectiveDate}
                  onChange={(e) => setAssignData({ ...assignData, effectiveDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl"
                >
                  Tugaskan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
