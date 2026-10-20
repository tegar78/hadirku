import React, { useState, useEffect } from 'react';
import { MapPin, Save, ShieldCheck, CheckCircle, Info, Calculator, Navigation, Clipboard, Compass } from 'lucide-react';
import { api } from '../services/api';
import LeafletOfficeMap from '../components/LeafletOfficeMap';

export default function OfficeSettingsView() {
  const [office, setOffice] = useState({
    officeName: 'Kantor Pusat HadirKu Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    radiusMeters: 50.0,
  });

  // Separate string state for reliable typing (prevents reset to 0 when typing '-' or '.')
  const [latInput, setLatInput] = useState('-6.2088');
  const [lngInput, setLngInput] = useState('106.8456');
  const [pasteCoord, setPasteCoord] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Test distance simulator state
  const [testLat, setTestLat] = useState(-6.20875);
  const [testLon, setTestLon] = useState(106.84558);
  const [simulatedDistance, setSimulatedDistance] = useState(null);

  useEffect(() => {
    fetchOffice();
  }, []);

  const fetchOffice = async () => {
    try {
      setLoading(true);
      const res = await api.getOffice();
      if (res.data) {
        setOffice(res.data);
        setLatInput(String(res.data.latitude));
        setLngInput(String(res.data.longitude));
      }
    } catch (err) {
      console.error('Fetch office error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Called when map pin is dragged or map is clicked
  const handleCoordinateChange = (lat, lng) => {
    const cleanLat = parseFloat(lat.toFixed(6));
    const cleanLng = parseFloat(lng.toFixed(6));
    setOffice((prev) => ({
      ...prev,
      latitude: cleanLat,
      longitude: cleanLng,
    }));
    setLatInput(cleanLat.toString());
    setLngInput(cleanLng.toString());
  };

  // Safe manual latitude input handler
  const handleLatInputChange = (val) => {
    setLatInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && val.trim() !== '' && val !== '-' && val !== '-.') {
      setOffice((prev) => ({ ...prev, latitude: parsed }));
    }
  };

  // Safe manual longitude input handler
  const handleLngInputChange = (val) => {
    setLngInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && val.trim() !== '' && val !== '-' && val !== '-.') {
      setOffice((prev) => ({ ...prev, longitude: parsed }));
    }
  };

  // Parse pasted coordinates e.g. "-6.1351, 106.6723" or "-6.1351 106.6723"
  const handleApplyPastedCoord = () => {
    if (!pasteCoord.trim()) return;
    const parts = pasteCoord.replace(/[;,]/g, ' ').trim().split(/\s+/);
    if (parts.length >= 2) {
      const parsedLat = parseFloat(parts[0]);
      const parsedLng = parseFloat(parts[1]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setOffice((prev) => ({
          ...prev,
          latitude: parsedLat,
          longitude: parsedLng,
        }));
        setLatInput(parsedLat.toString());
        setLngInput(parsedLng.toString());
        setPasteCoord('');
        setNotification(`Koordinat berhasil diterapkan: ${parsedLat}, ${parsedLng}`);
        setTimeout(() => setNotification(null), 3000);
        return;
      }
    }
    alert('Format koordinat tidak dikenali. Format yang didukung: "-6.123456, 106.789012"');
  };

  // Quick Preset Locations
  const handleApplyPreset = (name, lat, lng) => {
    setOffice((prev) => ({
      ...prev,
      officeName: prev.officeName || name,
      latitude: lat,
      longitude: lng,
    }));
    setLatInput(lat.toString());
    setLngInput(lng.toString());
    setNotification(`Lokasi dipindah ke ${name}`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Set office coordinate directly from simulator/employee test coordinate
  const handleSetOfficeFromTestCoord = () => {
    if (testLat && testLon) {
      setOffice((prev) => ({
        ...prev,
        latitude: testLat,
        longitude: testLon,
      }));
      setLatInput(testLat.toString());
      setLngInput(testLon.toString());
      setNotification(`Titik kantor berhasil disesuaikan dengan koordinat uji coba (${testLat}, ${testLon})! Klik "Simpan Perubahan" untuk menyimpan ke database.`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        officeName: office.officeName,
        latitude: parseFloat(latInput) || office.latitude,
        longitude: parseFloat(lngInput) || office.longitude,
        radiusMeters: parseFloat(office.radiusMeters) || 50,
      };

      await api.updateOffice(payload);
      setOffice(payload);
      setNotification('✅ Pengaturan titik kantor dan radius geofencing berhasil disimpan!');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengaturan kantor.');
    } finally {
      setSaving(false);
    }
  };

  // Client-side Haversine for real-time testing simulation
  const runDistanceSimulation = () => {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const phi1 = toRad(testLat);
    const phi2 = toRad(office.latitude);
    const dPhi = toRad(office.latitude - testLat);
    const dLambda = toRad(office.longitude - testLon);

    const a =
      Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.round(R * c * 10) / 10;
    setSimulatedDistance(dist);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-card border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            Pengaturan Titik & Geofencing Kantor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tentukan koordinat pusat kantor dan radius batas absensi presisi menggunakan peta interaktif OpenStreetMap & formula Haversine.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-900/40 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Controls */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl glass-card border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Detail Lokasi Kantor
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Ketik atau Klik Peta</span>
            </h3>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Nama Kantor / Gedung *</label>
              <input
                type="text"
                value={office.officeName}
                onChange={(e) => setOffice({ ...office, officeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Quick Paste from Google Maps */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
              <label className="block text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5" />
                Tempel Koordinat Google Maps:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: -6.134, 106.6837"
                  value={pasteCoord}
                  onChange={(e) => setPasteCoord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPastedCoord()}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleApplyPastedCoord}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-600 text-white rounded-lg font-semibold text-[11px] transition-all cursor-pointer"
                >
                  Pasang
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Latitude *</label>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => handleLatInputChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Longitude *</label>
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => handleLngInputChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Pilih Lokasi Cepat:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('Kantor Pusat HadirKu Jakarta', -6.1754, 106.8272)}
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium transition-all cursor-pointer"
                >
                  🏛️ Monas Jakarta
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('Kantor Cabang Tangerang', -6.134, 106.6837)}
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium transition-all cursor-pointer"
                >
                  🏢 Tangerang
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('Kantor SCBD Sudirman', -6.2238, 106.8091)}
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium transition-all cursor-pointer"
                >
                  🏙️ SCBD Jakarta
                </button>
              </div>
            </div>

            {/* Radius Toleransi */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 font-medium">Radius Toleransi Geofence</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={office.radiusMeters}
                    onChange={(e) => setOffice({ ...office, radiusMeters: parseFloat(e.target.value) || 10 })}
                    className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-cyan-400 font-bold font-mono text-right text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-cyan-400 font-bold font-mono">meter</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={Math.min(office.radiusMeters, 2000)}
                onChange={(e) => setOffice({ ...office, radiusMeters: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[50, 100, 200, 500, 1000, 5000].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setOffice({ ...office, radiusMeters: r })}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                      office.radiusMeters === r
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Validasi Haversine Otomatis
              </div>
              <p>
                Karyawan yang berada lebih dari <b className="text-white">{office.radiusMeters} meter</b> dari koordinat ini akan otomatis ditolak saat melakukan absen masuk/pulang.
              </p>
            </div>
          </div>

          {/* Realtime Distance Calculator / Simulator */}
          <div className="p-5 rounded-2xl glass-card border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                Simulasi Jarak Koordinat Karyawan
              </h4>
              <button
                type="button"
                onClick={handleSetOfficeFromTestCoord}
                title="Pindahkan titik kantor langsung ke koordinat uji coba di bawah"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
              >
                Set Kantor ke Titik Ini
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[10px]">Lat Uji Coba</label>
                <input
                  type="number"
                  step="any"
                  value={testLat}
                  onChange={(e) => setTestLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Lon Uji Coba</label>
                <input
                  type="number"
                  step="any"
                  value={testLon}
                  onChange={(e) => setTestLon(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono text-[11px]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={runDistanceSimulation}
              className="w-full py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-semibold border border-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              Hitung Jarak & Cek Status
            </button>

            {simulatedDistance !== null && (
              <div
                className={`p-3 rounded-xl border text-center font-medium ${
                  simulatedDistance <= office.radiusMeters
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <p className="text-sm font-bold font-mono">{simulatedDistance} meter</p>
                <p className="text-[11px] mt-0.5">
                  {simulatedDistance <= office.radiusMeters
                    ? '✅ Di Dalam Radius (Absensi Diterima)'
                    : '❌ Di Luar Radius (Absensi Ditolak)'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Interactive Leaflet Map */}
        <div className="lg:col-span-2 space-y-3">
          <LeafletOfficeMap
            latitude={office.latitude}
            longitude={office.longitude}
            radiusMeters={office.radiusMeters}
            officeName={office.officeName}
            onChangeCoordinates={handleCoordinateChange}
          />
        </div>
      </div>
    </div>
  );
}
