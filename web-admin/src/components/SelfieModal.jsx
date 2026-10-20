import React from 'react';
import { X, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SelfieModal({ attendance, onClose }) {
  if (!attendance) return null;

  const photoUrl = attendance.photoInPath
    ? attendance.photoInPath
    : attendance.photoOutPath || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h3 className="font-bold text-base text-white">Bukti Biometrik Selfie Kehadiran</h3>
            <p className="text-xs text-slate-400">Verifikasi wajah dan titik koordinat absensi</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Photo Display */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[260px]">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Selfie Kehadiran"
                className="w-full max-h-[320px] object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
                }}
              />
            ) : (
              <div className="p-6 text-center text-slate-500">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">Foto selfie tidak tersedia untuk data ini.</p>
              </div>
            )}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold backdrop-blur flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Wajah Terverifikasi
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-slate-400 block mb-1">Status Kehadiran</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  attendance.status === 'on_time'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : attendance.status === 'late'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {attendance.status === 'on_time'
                  ? 'Tepat Waktu'
                  : attendance.status === 'late'
                  ? 'Terlambat'
                  : attendance.status}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-slate-400 block mb-1">Jarak ke Kantor</span>
              <span className="font-semibold text-cyan-300 font-mono">
                {attendance.distanceInMeters ? `${attendance.distanceInMeters} meter` : 'Dalam Radius'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 col-span-2">
              <span className="text-slate-400 block mb-1">Koordinat GPS Masuk</span>
              <span className="font-mono text-slate-300">
                {attendance.latIn && attendance.longIn
                  ? `${attendance.latIn}, ${attendance.longIn}`
                  : 'Koordinat tidak tercatat'}
              </span>
            </div>

            {attendance.notes && (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 col-span-2">
                <span className="text-slate-400 block mb-1">Catatan Karyawan</span>
                <p className="text-slate-200">{attendance.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
