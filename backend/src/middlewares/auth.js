const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

async function authGuard(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token otorisasi tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hadirku_super_secret_jwt_key_2026');

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Akun tidak aktif atau pengguna tidak ditemukan.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi login telah kedaluwarsa. Silakan login kembali.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.',
    });
  }
}

function adminGuard(req, res, next) {
  if (!req.user || req.user.role !== 'hr_admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses terlarang. Fitur ini hanya untuk HR / Admin.',
    });
  }
  next();
}

module.exports = {
  authGuard,
  adminGuard,
};
