const prisma = require('../config/prisma');

async function getAllShifts(req, res) {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        _count: {
          select: { userSchedules: true, attendances: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    console.error('getAllShifts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data master shift.',
    });
  }
}

async function createShift(req, res) {
  try {
    const { shiftName, startTime, endTime, lateToleranceMinutes } = req.body;
    if (!shiftName || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Nama shift, jam masuk, dan jam pulang wajib diisi.',
      });
    }

    const shift = await prisma.shift.create({
      data: {
        shiftName,
        startTime,
        endTime,
        lateToleranceMinutes: lateToleranceMinutes ? parseInt(lateToleranceMinutes) : 15,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Shift kerja berhasil ditambahkan.',
      data: shift,
    });
  } catch (error) {
    console.error('createShift error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan shift kerja.',
    });
  }
}

async function updateShift(req, res) {
  try {
    const { id } = req.params;
    const { shiftName, startTime, endTime, lateToleranceMinutes } = req.body;

    const shift = await prisma.shift.update({
      where: { id: parseInt(id) },
      data: {
        ...(shiftName && { shiftName }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(lateToleranceMinutes !== undefined && {
          lateToleranceMinutes: parseInt(lateToleranceMinutes),
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Shift kerja berhasil diperbarui.',
      data: shift,
    });
  } catch (error) {
    console.error('updateShift error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui shift kerja.',
    });
  }
}

async function deleteShift(req, res) {
  try {
    const { id } = req.params;
    await prisma.shift.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: 'Shift berhasil dihapus.',
    });
  } catch (error) {
    console.error('deleteShift error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus shift kerja. Pastikan tidak ada jadwal yang terikat.',
    });
  }
}

async function assignSchedule(req, res) {
  try {
    const { userId, shiftId, effectiveDate } = req.body;
    if (!userId || !shiftId || !effectiveDate) {
      return res.status(400).json({
        success: false,
        message: 'Karyawan, shift, dan tanggal penugasan wajib diisi.',
      });
    }

    const date = new Date(effectiveDate);
    date.setHours(0, 0, 0, 0);

    const schedule = await prisma.userSchedule.upsert({
      where: {
        userId_effectiveDate: {
          userId: parseInt(userId),
          effectiveDate: date,
        },
      },
      update: {
        shiftId: parseInt(shiftId),
      },
      create: {
        userId: parseInt(userId),
        shiftId: parseInt(shiftId),
        effectiveDate: date,
      },
      include: {
        user: { select: { fullName: true, nip: true } },
        shift: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Jadwal shift berhasil ditugaskan.',
      data: schedule,
    });
  } catch (error) {
    console.error('assignSchedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menetapkan jadwal shift.',
    });
  }
}

module.exports = {
  getAllShifts,
  createShift,
  updateShift,
  deleteShift,
  assignSchedule,
};
