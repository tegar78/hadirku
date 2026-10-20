import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.jpg';

export default function LoginView() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('admin@hadirku.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAutofill = () => {
    setIdentifier('admin@hadirku.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="rounded-3xl glass-card p-8 border-slate-800 shadow-2xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-block relative">
              <img
                src={logoImg}
                alt="HadirKu"
                className="w-16 h-16 rounded-2xl mx-auto object-cover ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-950/60"
              />
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-cyan-500 text-slate-950">
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Hadir<span className="text-cyan-400">Ku</span> HR Portal
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Sistem Absensi Kantor Berbasis Geofencing GPS & Verifikasi Biometrik Wajah
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">Email Kantor atau NIP</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="admin@hadirku.com atau ADM-001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Portal Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Autofill Helper */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={handleDemoAutofill}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] text-cyan-400 border border-cyan-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gunakan Akun Admin Demo (1-Klik)</span>
            </button>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">
              admin@hadirku.com • password123
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-600 mt-6">
          &copy; {new Date().getFullYear()} HadirKu Enterprise Attendance Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
