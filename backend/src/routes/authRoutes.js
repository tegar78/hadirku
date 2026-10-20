const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authGuard } = require('../middlewares/auth');

router.post('/login', authController.login);
router.get('/me', authGuard, authController.getMe);
router.put('/change-password', authGuard, authController.changePassword);

module.exports = router;
