import React from 'react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.jpg';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Ringkasan & Live',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'employees',
      label: 'Kelola Karyawan',
      icon: Users,
    },
    {
      id: 'office',
      label: 'Titik & Radius Kantor',
      icon: MapPin,
    },
    {
      id: 'shifts',
      label: 'Jam Kerja & Shift',
      icon: Clock,
    },
    {
      id: 'leaves',
      label: 'Persetujuan Cuti/Izin',
      icon: CalendarCheck,
    },
    {
      id: 'reports',
      label: 'Laporan Rekapitulasi',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between p-4 sticky top-0 z-40 backdrop-blur-xl">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <img
            src={logoImg}
            alt="HadirKu Logo"
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/50"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">Hadir<span className="text-cyan-400">Ku</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">HR</span>
            </div>
            <p className="text-[11px] text-slate-400">Presensi & Geofencing</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Navigasi Utama</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'HR Admin'}</p>
              <p className="text-[10px] text-cyan-400 font-mono truncate">{user?.nip || 'ADM-001'}</p>
            </div>
          </div>
          <span title="Administrator">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          </span>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar dari Sesi
        </button>
      </div>
    </aside>
  );
}
