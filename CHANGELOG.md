# CHANGELOG — HADIRKU

Semua perubahan dan perkembangan fitur HadirKu didokumentasikan secara berkala pada file ini.

## [1.0.0] - 2026-10-19
### Selesai Diimplementasikan & Diverifikasi
- **Aset Visual & Branding**:
  - Logo resmi HadirKu bertema *Intelligent Attendance & Geofencing* (cyan & indigo corporate modern vector) di-generate untuk branding web, favicon, dan mobile.
- **Backend API (Node.js & MySQL)**:
  - Express.js API server aktif pada port `5050` dengan CORS dan static file serving `/uploads`.
  - Prisma ORM tersinkronisasi ke MariaDB/MySQL pada `localhost:3306/hadirku_db`.
  - 7 Tabel Database: `users`, `office_settings`, `shifts`, `user_schedules`, `holidays`, `attendances`, `leave_requests`.
  - Implementasi formula Haversine untuk validasi geofencing radius kantor.
  - Seeder data default: Admin HR (`admin@hadirku.com`), 3 Karyawan (`EMP-001`, `EMP-002`, `EMP-003`), 2 Master Shift, dan pengaturan kantor Jakarta CBD.
  - Endpoints lengkap untuk autentikasi JWT, absensi masuk/pulang selfie, kelola karyawan, master shift, persetujuan cuti, dan laporan rekapitulasi.
- **Web Admin Portal HR (React Vite & Tailwind CSS)**:
  - Antarmuka modern dark tech glassmorphism pada port `3000`.
  - Login page dengan autofill 1-klik akun demo.
  - Dashboard realtime dengan KPI cards (Total Karyawan, Tepat Waktu, Terlambat, Izin/Cuti, Belum Hadir) dan live attendance table.
  - Halaman Titik & Radius Kantor dengan peta interaktif Leaflet, pin lokasi draggable, visualisasi lingkaran radius geofence, simulator kalkulasi jarak, dan geolocation GPS browser.
  - Halaman Manajemen Karyawan dengan CRUD modal, search/filter divisi, dan reset device ID binding.
  - Halaman Jam Kerja & Shift dengan CRUD master shift dan modal penugasan jadwal karyawan.
  - Halaman Persetujuan Izin & Cuti dengan tinjauan surat lampiran, modal tolak dengan alasan, dan pemotongan kuota cuti otomatis.
  - Halaman Laporan Rekapitulasi dengan filter rentang tanggal/departemen, preview foto selfie biometrik, dan ekspor ke file Excel (.xlsx) via SheetJS serta cetak PDF.
  - Pengujian End-to-End dengan browser subagent berhasil diverifikasi 100%.
- **Mobile App Karyawan (React Native Expo)**:
  - Struktur aplikasi mobile React Native Expo di `mobile/`.
  - Layar kamera depan selfie dengan panduan bingkai oval wajah (*Face Framing*) dan fallback kamera native berkinerja tinggi.
  - Integrasi deteksi Fake GPS (*Mock Location*) dan perhitungan jarak Haversine ke kantor.
  - Layar Home dengan jam digital presisi, status jadwal shift, radar jarak GPS, dan tombol absensi masuk/pulang.
  - **Fitur Baru: Pengajuan Cuti, Izin Sakit & Urusan Pribadi**:
    - Kartu Layanan Mandiri Karyawan di Home Screen & Bottom Navigation Bar untuk navigasi cepat (*Presensi* ↔ *Cuti & Izin*).
    - Tampilan ringkasan sisa kuota cuti tahunan berjalan.
    - Modal interaktif pengajuan izin dengan kategori: 🏖️ *Cuti Tahunan*, 🩺 *Izin Sakit*, 📝 *Izin Kepentingan Pribadi*.
    - Preset durasi cepat (1 Hari, 2 Hari, 3 Hari) dan input tanggal terformat YYYY-MM-DD.
    - Lampiran bukti/dokumen (surat keterangan dokter) langsung dari Kamera HP atau Galeri Gambar.
    - Riwayat status pengajuan (*Pending*, *Approved*, *Rejected* beserta alasan dari HR).
- **Backend AI Face Detection & Leave Engine**:
  - Filter biometrik wajah Pico AI (`facefinder.bin` + `jpeg-js`) pada endpoint `/api/attendance/clock-in` dan `clock-out` yang menolak foto sembarang tanpa wajah asli manusia.
  - Endpoint `POST /api/leaves` (dukungan foto surat dokter Base64), `GET /api/leaves/my-leaves`, dan sinkronisasi otomatis absensi status `leave` saat pengajuan disetujui HR.

