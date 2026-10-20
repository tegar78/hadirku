import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Smartphone,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';

export default function EmployeesView() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    nip: '',
    fullName: '',
    email: '',
    password: '',
    department: '',
    position: '',
    role: 'employee',
    leaveQuota: 12,
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployees({ search, department });
      setEmployees(res.data);
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [department]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      nip: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      fullName: '',
      email: '',
      password: 'password123',
      department: 'IT Engineering',
      position: '',
      role: 'employee',
      leaveQuota: 12,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      nip: emp.nip,
      fullName: emp.fullName,
      email: emp.email,
      password: '',
      department: emp.department,
      position: emp.position,
      role: emp.role,
      leaveQuota: emp.leaveQuota,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, formData);
        showNotification(`Data karyawan ${formData.fullName} berhasil diperbarui.`);
      } else {
        await api.createEmployee(formData);
        showNotification(`Karyawan baru ${formData.fullName} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data karyawan.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (emp) => {
    if (confirm(`Yakin ingin menghapus karyawan "${emp.fullName}" (${emp.nip})?`)) {
      try {
        await api.deleteEmployee(emp.id);
        showNotification(`Karyawan ${emp.fullName} berhasil dihapus.`);
        fetchEmployees();
      } catch (err) {
        alert(err.message || 'Gagal menghapus karyawan.');
      }
    }
  };

  const handleResetDevice = async (emp) => {
    if (confirm(`Reset pengikatan HP (Device ID) untuk ${emp.fullName}? Karyawan dapat login di perangkat baru.`)) {
      try {
        const res = await api.resetDevice(emp.id);
        showNotification(res.message);
        fetchEmployees();
      } catch (err) {
        alert(err.message || 'Gagal mereset perangkat.');
      }
    }
  };

  const departmentsList = ['IT Engineering', 'Human Resources', 'Operations', 'Finance & Accounting', 'Marketing & Sales'];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-card border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Manajemen Data Karyawan</h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola profil, NIP, jatah cuti tahunan, dan penguncian perangkat (*Device Binding*)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-cyan-950 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Karyawan
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl glass-card border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIP, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="">Semua Departemen</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl glass-card border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Karyawan & NIP</th>
                <th className="py-3 px-4">Email Kontak</th>
                <th className="py-3 px-4">Departemen & Jabatan</th>
                <th className="py-3 px-4">Hak Akses</th>
                <th className="py-3 px-4">Sisa Cuti</th>
                <th className="py-3 px-4">Status Device</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Memuat data karyawan...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Belum ada data karyawan yang terdaftar.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{emp.fullName}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{emp.nip}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{emp.email}</td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{emp.department}</div>
                      <div className="text-[11px] text-slate-400">{emp.position}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.role === 'hr_admin'
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {emp.role === 'hr_admin' ? 'HR / Admin' : 'Karyawan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                      {emp.leaveQuota} hari
                    </td>
                    <td className="py-3 px-4">
                      {emp.deviceId ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]" title={`ID: ${emp.deviceId}`}>
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Terikat HP</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Bebas (Belum Terikat)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {emp.deviceId && (
                          <button
                            onClick={() => handleResetDevice(emp)}
                            title="Reset Ikatan Device ID HP"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-amber-400 transition-colors cursor-pointer"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Karyawan"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600/30 text-cyan-400 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          title="Hapus Karyawan"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">NIP Karyawan *</label>
                  <input
                    type="text"
                    required
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Hak Akses Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="employee">Karyawan (Mobile)</option>
                    <option value="hr_admin">HR / Admin Kantor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Email Kantor *</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@perusahaan.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {editingEmployee ? 'Password Baru (Kosongkan jika tidak ubah)' : 'Password Awal *'}
                  </label>
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Departemen / Divisi *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {departmentsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Jabatan / Posisi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Staff IT / Supervisor"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Jatah Kuota Cuti Tahunan (Hari)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.leaveQuota}
                  onChange={(e) => setFormData({ ...formData, leaveQuota: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-900/40 disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
