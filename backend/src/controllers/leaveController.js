const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { getLocalDateOnly } = require('../utils/dateUtils');

async function createLeaveRequest(req, res) {
  try {
    const userId = req.user.id;
    const { leaveType, startDate, endDate, reason, attachmentBase64 } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Tipe izin/cuti, tanggal mulai, tanggal selesai, dan alasan wajib diisi.',
      });
    }

    const start = getLocalDateOnly(startDate);
    const end = getLocalDateOnly(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
      });
    }

    // Calculate days requested
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((end - start) / oneDay)) + 1;

    // Check user leave quota for annual leave
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (leaveType === 'annual' && user.leaveQuota < diffDays) {
      return res.status(400).json({
        success: false,
        message: `Sisa kuota cuti tahunan Anda tidak mencukupi (${user.leaveQuota} hari tersisa, mengajukan ${diffDays} hari).`,
      });
    }

    let attachmentPath = null;
    if (req.file) {
      attachmentPath = `/uploads/leaves/${req.file.filename}`;
    } else if (attachmentBase64) {
      const base64Clean = attachmentBase64.replace(/^data:image\/\w+;base64,/, '');
      const filename = `leave-${userId}-${Date.now()}.jpg`;
      const filePath = path.join(__dirname, '../../uploads/leaves', filename);
      fs.writeFileSync(filePath, Buffer.from(base64Clean, 'base64'));
      attachmentPath = `/uploads/leaves/${filename}`;
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        attachmentPath,
        status: 'pending',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Pengajuan izin/cuti berhasil dikirim dan menunggu persetujuan HR.',
      data: leave,
    });
  } catch (error) {
    console.error('createLeaveRequest error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengajukan izin/cuti.',
    });
  }
}

async function getMyLeaves(req, res) {
  try {
    const userId = req.user.id;

    const [user, leaves] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { leaveQuota: true, fullName: true },
      }),
      prisma.leaveRequest.findMany({
        where: { userId },
        include: {
          approver: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        leaveQuota: user.leaveQuota,
        leaves,
      },
    });
  } catch (error) {
    console.error('getMyLeaves error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat izin/cuti.',
    });
  }
}

async function getAdminLeaves(req, res) {
  try {
    const { status, leaveType } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (leaveType) {
      where.leaveType = leaveType;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nip: true,
            fullName: true,
            department: true,
            position: true,
            leaveQuota: true,
          },
        },
        approver: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error('getAdminLeaves error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pengajuan cuti HR.',
    });
  }
}

async function updateLeaveStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus bernilai approved atau rejected.',
      });
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan izin/cuti tidak ditemukan.',
      });
    }

    // If approving an annual leave, calculate days and deduct from leave quota
    if (status === 'approved' && leave.status !== 'approved') {
      const oneDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round(Math.abs((new Date(leave.endDate) - new Date(leave.startDate)) / oneDay)) + 1;

      if (leave.leaveType === 'annual') {
        const newQuota = Math.max(0, leave.user.leaveQuota - diffDays);
        await prisma.user.update({
          where: { id: leave.userId },
          data: { leaveQuota: newQuota },
        });
      }

      // Automatically create or update attendance records for those dates with status 'leave'
      const cur = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      while (cur <= end) {
        const dateRecord = getLocalDateOnly(cur);

        await prisma.attendance.upsert({
          where: {
            userId_attendanceDate: {
              userId: leave.userId,
              attendanceDate: dateRecord,
            },
          },
          update: {
            status: 'leave',
            notes: `Izin/Cuti (${leave.leaveType}): ${leave.reason}`,
          },
          create: {
            userId: leave.userId,
            attendanceDate: dateRecord,
            status: 'leave',
            notes: `Izin/Cuti (${leave.leaveType}): ${leave.reason}`,
          },
        });

        cur.setDate(cur.getDate() + 1);
      }
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leave.id },
      data: {
        status,
        approvedBy: adminId,
        rejectionReason: status === 'rejected' ? rejectionReason || 'Ditolak oleh HR' : null,
      },
      include: {
        user: { select: { fullName: true, nip: true, leaveQuota: true } },
        approver: { select: { fullName: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Pengajuan izin/cuti berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}.`,
      data: updatedLeave,
    });
  } catch (error) {
    console.error('updateLeaveStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status pengajuan cuti.',
    });
  }
}

module.exports = {
  createLeaveRequest,
  getMyLeaves,
  getAdminLeaves,
  updateLeaveStatus,
};
