import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export default function LeafletOfficeMap({
  latitude,
  longitude,
  radiusMeters,
  officeName,
  onChangeCoordinates,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix leaflet marker icon issues in bundled react apps
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const initialLat = Number(latitude) || -6.2088;
    const initialLng = Number(longitude) || 106.8456;
    const initialRadius = Number(radiusMeters) || 50;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initialLat, initialLng], 17);
    mapInstanceRef.current = map;

    // Standard OpenStreetMap Tile Layer (Free, reliable, no API Key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Marker
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      title: officeName || 'Titik Koordinat Kantor',
    }).addTo(map);
    markerRef.current = marker;

    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; color: #0f172a;">
        <strong style="color: #0284c7; font-size: 13px;">${officeName || 'Titik Kantor'}</strong><br/>
        <span>Lat: <b>${initialLat.toFixed(6)}</b></span><br/>
        <span>Lng: <b>${initialLng.toFixed(6)}</b></span><br/>
        <small style="color: #64748b; font-style: italic;">Geser pin atau klik peta untuk pindah lokasi</small>
      </div>
    `).openPopup();

    // Circle (Geofence Radius)
    const circle = L.circle([initialLat, initialLng], {
      color: '#06b6d4', // cyan-500
      fillColor: '#06b6d4',
      fillOpacity: 0.25,
      weight: 2,
      radius: initialRadius,
    }).addTo(map);
    circleRef.current = circle;

    // Ensure Leaflet calculates size properly in flex/grid layouts
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Handle marker drag
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      circle.setLatLng(position);
      marker.setPopupContent(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a;">
          <strong style="color: #0284c7; font-size: 13px;">${officeName || 'Titik Kantor'}</strong><br/>
          <span>Lat: <b>${position.lat.toFixed(6)}</b></span><br/>
          <span>Lng: <b>${position.lng.toFixed(6)}</b></span><br/>
          <small style="color: #059669; font-weight: 600;">Posisi baru dipilih</small>
        </div>
      `).openPopup();

      if (onChangeCoordinates) {
        onChangeCoordinates(position.lat, position.lng);
      }
    });

    // Handle map click
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      marker.setPopupContent(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a;">
          <strong style="color: #0284c7; font-size: 13px;">${officeName || 'Titik Kantor'}</strong><br/>
          <span>Lat: <b>${e.latlng.lat.toFixed(6)}</b></span><br/>
          <span>Lng: <b>${e.latlng.lng.toFixed(6)}</b></span><br/>
          <small style="color: #059669; font-weight: 600;">Posisi baru dipilih</small>
        </div>
      `).openPopup();

      if (onChangeCoordinates) {
        onChangeCoordinates(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map when props change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;

    const lat = Number(latitude);
    const lng = Number(longitude);
    const radius = Number(radiusMeters);

    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
        markerRef.current.setLatLng([lat, lng]);
        circleRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], 17);
      }
    }

    if (!isNaN(radius) && radius > 0) {
      circleRef.current.setRadius(radius);
    }
  }, [latitude, longitude, radiusMeters]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Fitur Geolocation tidak didukung oleh browser Anda.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude: curLat, longitude: curLng } = pos.coords;
        if (onChangeCoordinates) {
          onChangeCoordinates(curLat, curLng);
        }
        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          markerRef.current.setLatLng([curLat, curLng]);
          circleRef.current.setLatLng([curLat, curLng]);
          mapInstanceRef.current.setView([curLat, curLng], 18);
        }
      },
      (err) => {
        setIsLocating(false);
        alert(
          `Gagal mengambil lokasi GPS otomatis: ${err.message}.\n\nTips: Anda bisa mengklik langsung titik di peta, menggeser pin merah, atau mengetik koordinat latitude & longitude di form sebelah kiri.`
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-900">
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-900/40 transition-all cursor-pointer backdrop-blur disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11a7.978 7.978 0 001.329 4.394" />
          </svg>
          {isLocating ? 'Mencari GPS...' : 'Gunakan Lokasi GPS Saya'}
        </button>
      </div>
      <div ref={mapContainerRef} className="w-full h-[460px]" />
      <div className="bg-slate-900/90 border-t border-slate-800 p-2.5 px-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>💡 <b>Tips:</b> Klik pada peta atau geser pin merah untuk memindahkan titik koordinat kantor.</span>
        <span className="font-mono text-cyan-400">Radius Lingkaran: {radiusMeters || 50} meter</span>
      </div>
    </div>
  );
}
