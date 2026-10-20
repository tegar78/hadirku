const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { calculateHaversineDistance } = require('../utils/haversine');
const { getLocalDateOnly } = require('../utils/dateUtils');
const { detectFace } = require('../utils/faceDetector');

// Clock-In (Absen Masuk)
async function clockIn(req, res) {
  try {
    const userId = req.user.id;
    const { latitude, longitude, notes, isMockLocation, photoBase64 } = req.body;

    // 1. Anti-Mock Location Check
    if (isMockLocation === 'true' || isMockLocation === true) {
      return res.status(400).json({
        success: false,
        message: 'Pemalsuan lokasi (Fake GPS / Mock Location) terdeteksi. Absensi dibatalkan!',
      });
    }

    // 2. Validate Selfie Photo (Support multipart req.file OR base64 JSON payload)
    let photoInPath = null;
    let photoFullPath = null;
    if (req.file) {
      photoInPath = `/uploads/selfies/${req.file.filename}`;
      photoFullPath = path.join(__dirname, '../../uploads/selfies', req.file.filename);
    } else if (photoBase64) {
      const base64Clean = photoBase64.replace(/^data:image\/\w+;base64,/, '');
      const filename = `selfie-${userId}-${Date.now()}.jpg`;
      photoFullPath = path.join(__dirname, '../../uploads/selfies', filename);
      fs.writeFileSync(photoFullPath, Buffer.from(base64Clean, 'base64'));
      photoInPath = `/uploads/selfies/${filename}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Foto selfie wajah wajib diambil langsung menggunakan kamera.',
      });
    }

    // 2b. AI Face Verification Check (Must detect human face)
    const faceCheck = await detectFace(photoFullPath);
    if (!faceCheck.hasFace) {
      if (fs.existsSync(photoFullPath)) {
        try { fs.unlinkSync(photoFullPath); } catch (_) {}
      }
      return res.status(400).json({
        success: false,
        message: 'Wajah tidak terdeteksi pada foto selfie! Pastikan wajah Anda terlihat jelas dan menghadap ke kamera untuk absensi.',
      });
    }

    // 3. Validate Coordinates
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Titik koordinat GPS tidak valid.',
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // 4. Fetch Office Settings & Calculate Geofence (Haversine)
    let office = await prisma.officeSetting.findFirst();
    if (!office) {
      office = {
        officeName: 'Kantor Pusat HadirKu',
        latitude: -6.2088,
        longitude: 106.8456,
        radiusMeters: 100.0,
      };
    }

    const distance = calculateHaversineDistance(lat, lon, office.latitude, office.longitude);

    if (distance > office.radiusMeters) {
      return res.status(400).json({
        success: false,
        message: `Anda berada di luar radius kantor! Jarak Anda: ${distance} meter (Batas toleransi: ${office.radiusMeters} meter dari ${office.officeName}).`,
        data: {
          distanceInMeters: distance,
          allowedRadiusMeters: office.radiusMeters,
          officeCoordinates: { lat: office.latitude, lon: office.longitude },
        },
      });
    }

    // 5. Check if already clocked in today (Server Time)
    const now = new Date();
    const today = getLocalDateOnly(now);

    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_attendanceDate: {
          userId,
          attendanceDate: today,
        },
      },
    });

    if (existingAttendance && existingAttendance.clockInTime) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah melakukan absen masuk hari ini.',
        data: existingAttendance,
      });
    }

    // 6. Find Shift & Determine On-Time or Late
    const userSchedule = await prisma.userSchedule.findUnique({
      where: {
        userId_effectiveDate: {
          userId,
          effectiveDate: today,
        },
      },
      include: { shift: true },
    });

    let shift = userSchedule ? userSchedule.shift : await prisma.shift.findFirst();
    if (!shift) {
      shift = { id: null, startTime: '08:00:00', lateToleranceMinutes: 15 };
    }

    // Parse shift start time (e.g., "08:00:00")
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const shiftStartTime = new Date(now);
    shiftStartTime.setHours(startH, startM, 0, 0);

    const lateThresholdTime = new Date(shiftStartTime.getTime() + (shift.lateToleranceMinutes || 15) * 60 * 1000);

    let status = 'on_time';
    if (now > lateThresholdTime) {
      status = 'late';
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_attendanceDate: {
          userId,
          attendanceDate: today,
        },
      },
      update: {
        shiftId: shift.id,
        clockInTime: now,
        latIn: lat,
        longIn: lon,
        distanceInMeters: distance,
        photoInPath,
        status,
        notes: notes || null,
      },
      create: {
        userId,
        shiftId: shift.id,
        attendanceDate: today,
        clockInTime: now,
        latIn: lat,
        longIn: lon,
        distanceInMeters: distance,
        photoInPath,
        status,
        notes: notes || null,
      },
      include: { shift: true },
    });

    return res.status(200).json({
      success: true,
      message:
        status === 'late'
          ? `Absen masuk berhasil tercatat. Status: Terlambat (${distance}m dari kantor).`
          : `Absen masuk berhasil tercatat. Status: Tepat Waktu (${distance}m dari kantor).`,
      data: attendance,
    });
  } catch (error) {
    console.error('clockIn error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan absen masuk.',
    });
  }
}

// Clock-Out (Absen Pulang)
async function clockOut(req, res) {
  try {
    const userId = req.user.id;
    const { latitude, longitude, notes, isMockLocation, photoBase64 } = req.body;

    if (isMockLocation === 'true' || isMockLocation === true) {
      return res.status(400).json({
        success: false,
        message: 'Pemalsuan lokasi (Fake GPS) terdeteksi. Absensi dibatalkan!',
      });
    }

    let photoOutPath = null;
    let photoFullPath = null;
    if (req.file) {
      photoOutPath = `/uploads/selfies/${req.file.filename}`;
      photoFullPath = path.join(__dirname, '../../uploads/selfies', req.file.filename);
    } else if (photoBase64) {
      const base64Clean = photoBase64.replace(/^data:image\/\w+;base64,/, '');
      const filename = `selfie-out-${userId}-${Date.now()}.jpg`;
      photoFullPath = path.join(__dirname, '../../uploads/selfies', filename);
      fs.writeFileSync(photoFullPath, Buffer.from(base64Clean, 'base64'));
      photoOutPath = `/uploads/selfies/${filename}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Foto selfie wajah kepulangan wajib diambil menggunakan kamera.',
      });
    }

    // AI Face Verification Check for clock-out
    const faceCheck = await detectFace(photoFullPath);
    if (!faceCheck.hasFace) {
      if (fs.existsSync(photoFullPath)) {
        try { fs.unlinkSync(photoFullPath); } catch (_) {}
      }
      return res.status(400).json({
        success: false,
        message: 'Wajah tidak terdeteksi pada foto selfie! Pastikan wajah Anda terlihat jelas dan menghadap ke kamera untuk absensi.',
      });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Titik koordinat GPS tidak valid.',
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    let office = await prisma.officeSetting.findFirst();
    if (!office) {
      office = {
        officeName: 'Kantor Pusat HadirKu',
        latitude: -6.2088,
        longitude: 106.8456,
        radiusMeters: 100.0,
      };
    }

    const distance = calculateHaversineDistance(lat, lon, office.latitude, office.longitude);

    if (distance > office.radiusMeters) {
      return res.status(400).json({
        success: false,
        message: `Anda berada di luar radius kantor saat absen pulang! Jarak: ${distance} meter (Batas toleransi: ${office.radiusMeters} meter).`,
        data: { distanceInMeters: distance, allowedRadiusMeters: office.radiusMeters },
      });
    }

    const now = new Date();
    const today = getLocalDateOnly(now);

    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_attendanceDate: {
          userId,
          attendanceDate: today,
        },
      },
    });

    if (!existingAttendance || !existingAttendance.clockInTime) {
      return res.status(400).json({
        success: false,
        message: 'Anda belum melakukan absen masuk hari ini.',
      });
    }

    if (existingAttendance.clockOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah melakukan absen pulang hari ini.',
        data: existingAttendance,
      });
    }

    const attendance = await prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        clockOutTime: now,
        latOut: lat,
        longOut: lon,
        distanceOutMeters: distance,
        photoOutPath,
        ...(notes && { notes: existingAttendance.notes ? `${existingAttendance.notes} | Pulang: ${notes}` : notes }),
      },
      include: { shift: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Absen pulang berhasil tercatat. Selamat beristirahat!',
      data: attendance,
    });
  } catch (error) {
    console.error('clockOut error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan absen pulang.',
    });
  }
}

// Get Logged-in Employee Today Status
async function getTodayStatus(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const today = getLocalDateOnly(now);

    const [attendance, schedule, office] = await Promise.all([
      prisma.attendance.findUnique({
        where: {
          userId_attendanceDate: {
            userId,
            attendanceDate: today,
          },
        },
        include: { shift: true },
      }),
      prisma.userSchedule.findUnique({
        where: {
          userId_effectiveDate: {
            userId,
            effectiveDate: today,
          },
        },
        include: { shift: true },
      }),
      prisma.officeSetting.findFirst(),
    ]);

    const activeShift = schedule ? schedule.shift : await prisma.shift.findFirst();

    return res.status(200).json({
      success: true,
      data: {
        serverTime: now,
        attendanceDate: today,
        attendance: attendance || null,
        shift: activeShift,
        office: office || null,
      },
    });
  } catch (error) {
    console.error('getTodayStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil status kehadiran hari ini.',
    });
  }
}

// Get Logged-in Employee Attendance History
async function getMyHistory(req, res) {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const targetDate = new Date();
    const targetMonth = month !== undefined ? parseInt(month) : targetDate.getMonth() + 1;
    const targetYear = year !== undefined ? parseInt(year) : targetDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { shift: true },
      orderBy: { attendanceDate: 'desc' },
    });

    const summary = {
      totalPresent: attendances.filter((a) => a.clockInTime).length,
      totalOnTime: attendances.filter((a) => a.status === 'on_time').length,
      totalLate: attendances.filter((a) => a.status === 'late').length,
      totalLeave: attendances.filter((a) => a.status === 'leave').length,
    };

    return res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        summary,
        attendances,
      },
    });
  } catch (error) {
    console.error('getMyHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat absensi.',
    });
  }
}

// HR Admin: Live Today Monitoring
async function getAdminToday(req, res) {
  try {
    const today = getLocalDateOnly();

    const employees = await prisma.user.findMany({
      where: { role: 'employee', isActive: true },
      select: {
        id: true,
        nip: true,
        fullName: true,
        department: true,
        position: true,
      },
      orderBy: { fullName: 'asc' },
    });

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: today,
      },
      include: { shift: true },
    });

    const attendanceMap = new Map();
    todayAttendances.forEach((att) => {
      attendanceMap.set(att.userId, att);
    });

    const result = employees.map((emp) => {
      const att = attendanceMap.get(emp.id);
      return {
        ...emp,
        attendance: att || null,
        statusDisplay: !att
          ? 'Belum Absen'
          : att.status === 'on_time'
          ? 'Tepat Waktu'
          : att.status === 'late'
          ? 'Terlambat'
          : att.status === 'leave'
          ? 'Cuti / Izin'
          : 'Alpha',
      };
    });

    const stats = {
      totalEmployees: employees.length,
      presentToday: todayAttendances.filter((a) => a.clockInTime).length,
      onTimeToday: todayAttendances.filter((a) => a.status === 'on_time').length,
      lateToday: todayAttendances.filter((a) => a.status === 'late').length,
      notClockedIn: employees.length - todayAttendances.filter((a) => a.clockInTime).length,
    };

    return res.status(200).json({
      success: true,
      data: {
        stats,
        records: result,
      },
    });
  } catch (error) {
    console.error('getAdminToday error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data monitoring absensi hari ini.',
    });
  }
}

// HR Admin: Comprehensive Attendance Report / Recap (Date range, Department, Status)
async function getAdminRecap(req, res) {
  try {
    const { startDate, endDate, department, status, search } = req.query;

    const where = {};

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      where.attendanceDate = { gte: s, lte: e };
    } else {
      // Default to current month
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      where.attendanceDate = { gte: s, lte: e };
    }

    if (status) {
      where.status = status;
    }

    if (department || search) {
      where.user = {};
      if (department) {
        where.user.department = department;
      }
      if (search) {
        where.user.OR = [
          { fullName: { contains: search } },
          { nip: { contains: search } },
        ];
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nip: true,
            fullName: true,
            department: true,
            position: true,
          },
        },
        shift: true,
      },
      orderBy: [{ attendanceDate: 'desc' }, { clockInTime: 'desc' }],
    });

    return res.status(200).json({
      success: true,
      data: attendances,
    });
  } catch (error) {
    console.error('getAdminRecap error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat rekapitulasi data kehadiran.',
    });
  }
}

// HR Admin: Dashboard Statistics
async function getAdminDashboardStats(req, res) {
  try {
    const today = getLocalDateOnly();

    const [
      totalEmployees,
      totalActiveEmployees,
      todayAttendances,
      pendingLeaves,
      office,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'employee' } }),
      prisma.user.count({ where: { role: 'employee', isActive: true } }),
      prisma.attendance.findMany({
        where: { attendanceDate: today },
      }),
      prisma.leaveRequest.count({ where: { status: 'pending' } }),
      prisma.officeSetting.findFirst(),
    ]);

    const presentCount = todayAttendances.filter((a) => a.clockInTime).length;
    const onTimeCount = todayAttendances.filter((a) => a.status === 'on_time').length;
    const lateCount = todayAttendances.filter((a) => a.status === 'late').length;
    const notPresentCount = totalActiveEmployees - presentCount;

    return res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        totalActiveEmployees,
        presentToday: presentCount,
        onTimeToday: onTimeCount,
        lateToday: lateCount,
        notPresentToday: Math.max(0, notPresentCount),
        pendingLeaves,
        office,
      },
    });
  } catch (error) {
    console.error('getAdminDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik dashboard admin.',
    });
  }
}

module.exports = {
  clockIn,
  clockOut,
  getTodayStatus,
  getMyHistory,
  getAdminToday,
  getAdminRecap,
  getAdminDashboardStats,
};
