const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

async function login(req, res) {
  try {
    const { identifier, email, nip, password, deviceId } = req.body;
    const loginUser = identifier || email || nip;

    if (!loginUser || !password) {
      return res.status(400).json({
        success: false,
        message: 'NIP/Email dan kata sandi wajib diisi.',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: loginUser }, { nip: loginUser }],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak valid. Pengguna tidak ditemukan.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan oleh administrator kantor.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Kata sandi yang Anda masukkan salah.',
      });
    }

    // Device ID binding for mobile employees (Fase 4 Feature ready in Fase 1)
    if (deviceId && user.role === 'employee') {
      if (user.deviceId && user.deviceId !== deviceId) {
        return res.status(403).json({
          success: false,
          message:
            'Perangkat tidak dikenali. Akun Anda telah terikat pada perangkat lain. Silakan hubungi HR untuk reset perangkat.',
        });
      }

      if (!user.deviceId) {
        // Bind device on first mobile login
        await prisma.user.update({
          where: { id: user.id },
          data: { deviceId },
        });
        user.deviceId = deviceId;
      }
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'hadirku_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: {
          id: user.id,
          nip: user.nip,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position,
          leaveQuota: user.leaveQuota,
          deviceId: user.deviceId,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat login.',
    });
  }
}

async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nip: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        position: true,
        leaveQuota: true,
        deviceId: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil pengguna.',
    });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi saat ini dan kata sandi baru wajib diisi.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi baru minimal 6 karakter.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi saat ini tidak cocok.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return res.status(200).json({
      success: true,
      message: 'Kata sandi berhasil diperbarui.',
    });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui kata sandi.',
    });
  }
}

module.exports = {
  login,
  getMe,
  changePassword,
};
