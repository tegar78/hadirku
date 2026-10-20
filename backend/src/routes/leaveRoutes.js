const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authGuard, adminGuard } = require('../middlewares/auth');
const { uploadLeaveAttachment } = require('../middlewares/upload');

router.post('/', authGuard, uploadLeaveAttachment.single('attachment'), leaveController.createLeaveRequest);
router.get('/my-leaves', authGuard, leaveController.getMyLeaves);
router.get('/admin', authGuard, adminGuard, leaveController.getAdminLeaves);
router.put('/:id/status', authGuard, adminGuard, leaveController.updateLeaveStatus);

module.exports = router;
