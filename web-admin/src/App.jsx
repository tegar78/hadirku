import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoginView from './pages/LoginView';
import DashboardView from './pages/DashboardView';
import EmployeesView from './pages/EmployeesView';
import OfficeSettingsView from './pages/OfficeSettingsView';
import ShiftsView from './pages/ShiftsView';
import LeavesView from './pages/LeavesView';
import ReportsView from './pages/ReportsView';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Memuat Portal HadirKu...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const tabTitles = {
    dashboard: 'Ringkasan & Live Monitoring Kehadiran',
    employees: 'Manajemen Data Karyawan',
    office: 'Pengaturan Titik Geofencing & Radius Kantor',
    shifts: 'Pengaturan Jam Kerja & Master Shift',
    leaves: 'Persetujuan Pengajuan Cuti & Izin',
    reports: 'Rekapitulasi Kehadiran & Ekspor Laporan',
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigateTo={setActiveTab} />;
      case 'employees':
        return <EmployeesView />;
      case 'office':
        return <OfficeSettingsView />;
      case 'shifts':
        return <ShiftsView />;
      case 'leaves':
        return <LeavesView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView onNavigateTo={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar activeTabTitle={tabTitles[activeTab] || 'HadirKu HR Portal'} />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
