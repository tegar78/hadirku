const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authGuard, adminGuard } = require('../middlewares/auth');
const { uploadSelfie } = require('../middlewares/upload');

// Employee attendance actions
router.post('/clock-in', authGuard, uploadSelfie.single('photo'), attendanceController.clockIn);
router.post('/clock-out', authGuard, uploadSelfie.single('photo'), attendanceController.clockOut);
router.get('/today', authGuard, attendanceController.getTodayStatus);
router.get('/my-history', authGuard, attendanceController.getMyHistory);

// HR Admin monitoring & reports
router.get('/admin/stats', authGuard, adminGuard, attendanceController.getAdminDashboardStats);
router.get('/admin/today', authGuard, adminGuard, attendanceController.getAdminToday);
router.get('/admin/recap', authGuard, adminGuard, attendanceController.getAdminRecap);

module.exports = router;
