# HadirKu — Aplikasi Absensi Kantor Cerdas & Geofencing

![HadirKu Logo](./web-admin/public/logo.jpg)

**HadirKu** adalah solusi presensi kehadiran kantor modern berbasis **Geofencing GPS** presisi tinggi (Formula Haversine) dan **Verifikasi Biometrik Selfie (Face Detection)** untuk mencegah kecurangan absensi (*titip absen*, *fake GPS*, manipulasi jam perangkat).

---

## 🏛️ Arsitektur Monorepo

```
hadirku/
├── backend/                  # REST API: Node.js (Express) + Prisma ORM + MySQL / MariaDB
├── web-admin/                # Web Admin HR: React (Vite) + Tailwind CSS + Leaflet Maps + SheetJS
├── mobile/                   # Mobile App Karyawan: React Native (Expo) + Camera Selfie + Geolocation
├── BLUEPRINT.md              # Spesifikasi Arsitektur & Skema Database
├── CHANGELOG.md              # Riwayat Pengembangan Fitur
└── prd_hadirku_absensi_kantor.md # Dokumen Kebutuhan Produk (PRD)
```

---

## 🚀 Panduan Menjalankan Sistem

### 1. Backend API (Node.js & MySQL)
Server backend berjalan pada port **5050**.

```bash
cd backend

# 1. Pastikan MariaDB/MySQL aktif pada localhost:3306
# 2. Sinkronkan database schema ke MySQL
npx prisma db push

# 3. Masukkan data awal (Admin HR, Kantor, Shift, Karyawan)
node prisma/seed.js

# 4. Jalankan Server API
npm start
# atau mode development:
npm run dev
```

- **Health Check**: [http://localhost:5050/api/health](http://localhost:5050/api/health)
- **File Uploads**: [http://localhost:5050/uploads](http://localhost:5050/uploads)

---

### 2. Web Admin Portal (HR / Manajemen)
Portal Web Admin berjalan pada port **3000** (dilengkapi proxy otomatis ke backend).

```bash
cd web-admin

# Install dependensi (jika belum)
npm install

# Jalankan server frontend
npm run dev
```

Akses portal melalui browser: **[http://localhost:3000](http://localhost:3000)**

#### 🔑 Akun Login Default
| Peran (Role) | Email / NIP | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **HR / Admin** | `admin@hadirku.com` *(ADM-001)* | `password123` | Akses penuh dashboard, geofence map, kelola karyawan, shift, approval cuti, dan ekspor Excel |
| **Karyawan 1** | `budi@hadirku.com` *(EMP-001)* | `password123` | Karyawan IT Engineering |
| **Karyawan 2** | `siti@hadirku.com` *(EMP-002)* | `password123` | Karyawan IT Engineering |
| **Karyawan 3** | `tegar@hadirku.com` *(EMP-003)* | `password123` | Karyawan Operations |

*(Tersedia tombol **Gunakan Akun Admin Demo (1-Klik)** pada halaman login untuk masuk instan).*

---

### 3. Mobile App (Karyawan - React Native Expo)
Aplikasi mobile karyawan untuk Absen Selfie & Validasi Geofencing:

```bash
cd mobile

# Jalankan Expo bundler
npx expo start
```
- Buka via **Expo Go** di smartphone (pindai QR code) atau emulator Android/iOS.
- Fitur kamera depan dengan panduan oval wajah (*Face Framing*), pencegahan *Fake GPS / Mock Location*, dan perhitungan jarak *real-time* ke radius kantor.

---

## 🛠️ Fitur-Fitur Utama yang Telah Selesai (Fase 1 – Fase 4)

1. **Geofencing Haversine Presisi**:
   - Menghitung jarak lengkung bumi antara GPS pengguna dan koordinat kantor.
   - Penolakan otomatis jika jarak melebihi batas radius kantor (default 50m / 100m).
2. **Biometrik Selfie & Anti-Fake GPS**:
   - Pengambilan foto langsung dari kamera depan.
   - Deteksi dan blokir status *Mock Location*.
   - Waktu kehadiran tercatat menggunakan *Server Timestamp* resmi.
3. **Peta Interaktif Geofencing (Leaflet)**:
   - Geser pin koordinat kantor pada peta.
   - Lingkaran visual radius kantor interaktif secara *real-time*.
   - Simulator kalkulasi jarak dan tombol *"Gunakan Lokasi GPS Saya"*.
4. **Manajemen Karyawan & Device ID Binding**:
   - CRUD profil karyawan, NIP, divisi, dan kuota cuti tahunan.
   - Penguncian akun pada perangkat HP (*Device ID Binding*) dengan tombol Reset oleh HR.
5. **Master Jam Kerja & Shift**:
   - Master jam masuk, jam pulang, dan toleransi menit keterlambatan.
   - Penugasan jadwal shift ke karyawan.
6. **Alur Izin & Cuti Otomatis**:
   - Tinjauan surat dokter/lampiran bukti pendukung.
   - Persetujuan/Penolakan oleh HR dengan pemotongan kuota cuti otomatis.
7. **Rekapitulasi & Ekspor Laporan**:
   - Filter tanggal, departemen, dan status kehadiran.
   - Ekspor data lengkap ke format **Excel (.xlsx)** via SheetJS dan cetak **PDF**.