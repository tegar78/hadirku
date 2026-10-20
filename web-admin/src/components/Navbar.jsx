import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Sparkles } from 'lucide-react';

export default function Navbar({ activeTabTitle }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="h-16 px-6 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-white capitalize">{activeTabTitle}</h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">
          <Sparkles className="w-3 h-3" />
          <span>Sistem Geofencing Aktif</span>
        </div>
      </div>

      {/* Clock & Status */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-medium text-slate-300">{formattedDate}</span>
          <div className="flex items-center justify-end gap-1 text-[11px] font-mono text-cyan-400">
            <Clock className="w-3 h-3" />
            <span>{formattedTime} WIB</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-400 hidden sm:inline">Server Terhubung</span>
        </div>
      </div>
    </header>
  );
}
