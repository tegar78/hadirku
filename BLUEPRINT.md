# BLUEPRINT ARSITEKTUR & DESAIN SISTEM — HADIRKU

| Dokumen | Keterangan |
| :--- | :--- |
| **Nama Produk** | HadirKu – Aplikasi Absensi Kantor Cerdas & Geofencing |
| **Arsitektur** | Monorepo: Backend API, Web Admin Dashboard (HR), Mobile App (Karyawan) |
| **Backend Stack** | Node.js (Express.js), Prisma ORM, MySQL/MariaDB |
| **Web Admin Stack** | React (Vite), Tailwind CSS, Lucide Icons, Leaflet Maps, SheetJS (Excel) |
| **Mobile App Stack** | React Native (Expo SDK), Camera Selfie Liveness, Geolocation Haversine |
| **Versi Desain** | 1.0.0 (Production Blueprint) |

---

## 1. Ringkasan Eksekutif & Tujuan Arsitektur
HadirKu dirancang untuk mendigitalkan dan mengamankan pencatatan kehadiran karyawan dengan:
1. **Geofencing Presisi Tinggi**: Validasi jarak koordinat perangkat ke titik koordinat kantor dengan formula Haversine ($\le \text{Radius Kantor}$, default 50 meter).
2. **Biometrik Selfie & Deteksi Wajah**: Pengambilan foto selfie langsung dari kamera dengan proteksi anti-fake GPS dan anti-foto galeri.
3. **Integritas Waktu Server**: Timestamp kehadiran selalu dicatat menggunakan jam server (UTC / WIB) untuk mencegah manipulasi jam lokal perangkat pengguna.
4. **Dashboard HR Komprehensif**: Manajemen karyawan, jadwal shift, pengajuan izin/cuti, pengaturan titik & radius kantor via peta interaktif Leaflet, serta ekspor laporan (Excel/CSV/PDF).

---

## 2. Struktur Monorepo
```
hadirku/
├── backend/                  # Node.js + Express + Prisma ORM + MySQL
│   ├── prisma/
│   │   ├── schema.prisma     # Definisi Skema MySQL
│   │   └── seed.js           # Seeder Data Awal (Admin, Kantor, Shift, Karyawan)
│   ├── src/
│   │   ├── config/           # Database & env config
│   │   ├── controllers/      # Auth, Attendance, Employee, Office, Shift, Leave, Report
│   │   ├── middlewares/      # Auth JWT, Role Guard, Multer Upload, Error Handler
│   │   ├── routes/           # REST API endpoints
│   │   ├── utils/            # Haversine Distance, Response Formatter, Date Utils
│   │   └── server.js         # Entry point Express API
│   ├── uploads/              # Direktori selfie & lampiran izin
│   └── package.json
├── web-admin/                # React (Vite) + Tailwind CSS + Lucide + Leaflet
│   ├── public/               # Favicon & assets
│   ├── src/
│   │   ├── assets/           # HadirKu branding & logo
│   │   ├── components/       # Layout, Navbar, Sidebar, StatCards, Modal, LeafletOfficeMap
│   │   ├── context/          # AuthContext (JWT State & User Role)
│   │   ├── pages/            # Dashboard, Employees, Shifts, OfficeSettings, Leaves, Reports, Login
│   │   ├── services/         # Axios API Client
│   │   ├── App.jsx           # React Router DOM v6
│   │   └── main.jsx
│   └── package.json
├── mobile/                   # React Native (Expo) - Fase Pengujian Karyawan
│   ├── src/
│   │   ├── screens/          # Login, ClockInOutSelfie, History, Leaves, Profile
│   │   └── services/         # API Client & Geolocation
│   └── package.json
├── BLUEPRINT.md
├── CHANGELOG.md
└── prd_hadirku_absensi_kantor.md
```

---

## 3. Skema Database Relasional (MySQL via Prisma)
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  employee
  hr_admin
}

enum AttendanceStatus {
  on_time
  late
  absent
  leave
}

enum LeaveType {
  annual
  sick
  permit
}

enum LeaveStatus {
  pending
  approved
  rejected
}

model User {
  id            Int            @id @default(autoincrement())
  nip           String         @unique @db.VarChar(50)
  fullName      String         @map("full_name") @db.VarChar(150)
  email         String         @unique @db.VarChar(150)
  passwordHash  String         @map("password_hash") @db.VarChar(255)
  role          Role           @default(employee)
  department    String         @db.VarChar(100)
  position      String         @db.VarChar(100)
  deviceId      String?        @map("device_id") @db.VarChar(100)
  leaveQuota    Int            @default(12) @map("leave_quota")
  isActive      Boolean        @default(true) @map("is_active")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  attendances   Attendance[]
  userSchedules UserSchedule[]
  leaveRequests LeaveRequest[] @relation("UserLeaveRequests")
  approvedLeaves LeaveRequest[] @relation("ApproverLeaveRequests")

  @@map("users")
}

model OfficeSetting {
  id           Int      @id @default(autoincrement())
  officeName   String   @map("office_name") @db.VarChar(150)
  latitude     Float
  longitude    Float
  radiusMeters Float    @default(50.0) @map("radius_meters")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("office_settings")
}

model Shift {
  id                   Int            @id @default(autoincrement())
  shiftName            String         @map("shift_name") @db.VarChar(100)
  startTime            String         @map("start_time") @db.VarChar(10) // "08:00:00"
  endTime              String         @map("end_time") @db.VarChar(10)   // "17:00:00"
  lateToleranceMinutes Int            @default(15) @map("late_tolerance_minutes")
  createdAt            DateTime       @default(now()) @map("created_at")

  userSchedules        UserSchedule[]
  attendances          Attendance[]

  @@map("shifts")
}

model UserSchedule {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  shiftId       Int      @map("shift_id")
  effectiveDate DateTime @map("effective_date") @db.Date

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  shift         Shift    @relation(fields: [shiftId], references: [id], onDelete: Cascade)

  @@unique([userId, effectiveDate])
  @@map("user_schedules")
}

model Holiday {
  id                Int      @id @default(autoincrement())
  holidayDate       DateTime @unique @map("holiday_date") @db.Date
  description       String   @db.VarChar(255)
  isNationalHoliday Boolean  @default(true) @map("is_national_holiday")

  @@map("holidays")
}

model Attendance {
  id                Int              @id @default(autoincrement())
  userId            Int              @map("user_id")
  shiftId           Int?             @map("shift_id")
  attendanceDate    DateTime         @map("attendance_date") @db.Date
  clockInTime       DateTime?        @map("clock_in_time")
  clockOutTime      DateTime?        @map("clock_out_time")
  latIn             Float?           @map("lat_in")
  longIn            Float?           @map("long_in")
  latOut            Float?           @map("lat_out")
  longOut           Float?           @map("long_out")
  distanceInMeters  Float?           @map("distance_in_meters")
  distanceOutMeters Float?           @map("distance_out_meters")
  photoInPath       String?          @map("photo_in_path") @db.VarChar(255)
  photoOutPath      String?          @map("photo_out_path") @db.VarChar(255)
  status            AttendanceStatus @default(on_time)
  notes             String?          @db.Text
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")

  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  shift             Shift?           @relation(fields: [shiftId], references: [id])

  @@unique([userId, attendanceDate])
  @@map("attendances")
}

model LeaveRequest {
  id              Int         @id @default(autoincrement())
  userId          Int         @map("user_id")
  leaveType       LeaveType   @map("leave_type")
  startDate       DateTime    @map("start_date") @db.Date
  endDate         DateTime    @map("end_date") @db.Date
  reason          String      @db.Text
  attachmentPath  String?     @map("attachment_path") @db.VarChar(255)
  status          LeaveStatus @default(pending)
  approvedBy      Int?        @map("approved_by")
  rejectionReason String?     @map("rejection_reason") @db.Text
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  user            User        @relation("UserLeaveRequests", fields: [userId], references: [id], onDelete: Cascade)
  approver        User?       @relation("ApproverLeaveRequests", fields: [approvedBy], references: [id])

  @@map("leave_requests")
}
```

---

## 4. Formula Geofencing (Haversine)
Perhitungan jarak antara titik koordinat karyawan $(lat_1, lon_1)$ dengan koordinat kantor $(lat_2, lon_2)$:
$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- Di mana $R = 6,371,000 \text{ meter}$ (Jari-jari bumi).
- Jika $d > \text{radiusMeters}$, maka request Clock-In/Clock-Out ditolak dengan pesan presisi: *"Anda berada di luar radius kantor ({d} meter dari toleransi {radiusMeters} meter)"*.

---

## 5. REST API Endpoints Specification
- **Auth**: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password`
- **Attendance**:
  - `POST /api/attendance/clock-in` (Multipart: selfie photo, lat, long, notes, deviceId)
  - `POST /api/attendance/clock-out` (Multipart: selfie photo, lat, long, notes)
  - `GET /api/attendance/today` (Status absen pengguna hari ini)
  - `GET /api/attendance/my-history` (Riwayat absen pengguna dengan filter bulan/tahun)
  - `GET /api/attendance/admin/today` (Monitoring absensi realtime seluruh karyawan)
  - `GET /api/attendance/admin/report` (Rekap absensi seluruh karyawan dengan filter rentang tanggal, departemen, status)
- **Employees**: `GET /api/employees`, `POST /api/employees`, `PUT /api/employees/:id`, `DELETE /api/employees/:id`
- **Office Settings**: `GET /api/office`, `PUT /api/office`
- **Shifts & Schedules**: `GET /api/shifts`, `POST /api/shifts`, `PUT /api/shifts/:id`, `GET /api/schedules`
- **Leave Requests**: `POST /api/leaves`, `GET /api/leaves/my-leaves`, `GET /api/leaves/admin`, `PUT /api/leaves/:id/status`

---

## 6. Modul Mobile App & Alur Pengajuan Izin/Cuti
1. **Layanan Mandiri Karyawan**:
   - Tab bar navigasi cepat: `Presensi` ↔ `Cuti & Izin`.
   - Ringkasan kuota cuti tahunan tersisa (`leaveQuota`).
   - Modal pengajuan izin dengan opsi kategori:
     - `annual`: Cuti Tahunan (otomatis memotong kuota saat di-approve HR).
     - `sick`: Izin Sakit (lampiran surat dokter dari kamera/galeri).
     - `permit`: Izin Keperluan Pribadi.
   - Preset tanggal cepat (Hari Ini, 2 Hari, 3 Hari) dan pemilih tanggal manual.
2. **AI Face Detection Biometrik (Anti-Fraud)**:
   - Evaluasi visual wajah menggunakan algoritma Pico AI (`facefinder.bin` + `jpeg-js`).
   - Foto non-wajah (seperti foto meja, layar monitor, atau keyboard) otomatis ditolak dengan pesan: *"Foto selfie wajah tidak terdeteksi. Pastikan wajah Anda terlihat jelas di kamera."*
3. **Workflow Approval HR**:
   - HR menerima notifikasi pengajuan baru di Web Admin.
   - HR dapat meninjau detail alasan, durasi tanggal, dan lampiran surat dokter.
   - Tindakan Approve otomatis mengubah status pengajuan dan meng-generate catatan presensi berstatus `leave` pada tanggal-tanggal tersebut.

