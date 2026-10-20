const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

async function getAllEmployees(req, res) {
  try {
    const { search, department, role, isActive } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { nip: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const employees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nip: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        position: true,
        deviceId: true,
        leaveQuota: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            attendances: true,
            leaveRequests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('getAllEmployees error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar karyawan.',
    });
  }
}

async function createEmployee(req, res) {
  try {
    const {
      nip,
      fullName,
      email,
      password,
      role = 'employee',
      department,
      position,
      leaveQuota = 12,
    } = req.body;

    if (!nip || !fullName || !email || !department || !position) {
      return res.status(400).json({
        success: false,
        message: 'NIP, nama lengkap, email, departemen, dan posisi jabatan wajib diisi.',
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { nip }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Karyawan dengan Email atau NIP tersebut sudah terdaftar.',
      });
    }

    const defaultPassword = password || 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const employee = await prisma.user.create({
      data: {
        nip,
        fullName,
        email,
        passwordHash,
        role,
        department,
        position,
        leaveQuota: parseInt(leaveQuota),
        isActive: true,
      },
      select: {
        id: true,
        nip: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        position: true,
        leaveQuota: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Data karyawan berhasil ditambahkan.',
      data: employee,
    });
  } catch (error) {
    console.error('createEmployee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data karyawan.',
    });
  }
}

async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      department,
      position,
      role,
      leaveQuota,
      isActive,
      password,
    } = req.body;

    const dataToUpdate = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(department && { department }),
      ...(position && { position }),
      ...(role && { role }),
      ...(leaveQuota !== undefined && { leaveQuota: parseInt(leaveQuota) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    };

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.passwordHash = await bcrypt.hash(password, salt);
    }

    const employee = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      select: {
        id: true,
        nip: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        position: true,
        deviceId: true,
        leaveQuota: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Data karyawan berhasil diperbarui.',
      data: employee,
    });
  } catch (error) {
    console.error('updateEmployee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data karyawan.',
    });
  }
}

async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id);

    // Prevent deleting oneself
    if (req.user.id === employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Anda tidak dapat menghapus akun Anda sendiri.',
      });
    }

    await prisma.user.delete({
      where: { id: employeeId },
    });

    return res.status(200).json({
      success: true,
      message: 'Karyawan berhasil dihapus dari sistem.',
    });
  } catch (error) {
    console.error('deleteEmployee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus karyawan. Kemungkinan data memiliki riwayat kehadiran.',
    });
  }
}

async function resetDevice(req, res) {
  try {
    const { id } = req.params;
    const employee = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { deviceId: null },
      select: { id: true, fullName: true, nip: true },
    });

    return res.status(200).json({
      success: true,
      message: `Device ID untuk karyawan ${employee.fullName} berhasil di-reset. Karyawan dapat login di perangkat baru.`,
    });
  } catch (error) {
    console.error('resetDevice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal me-reset device ID karyawan.',
    });
  }
}

module.exports = {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetDevice,
};
