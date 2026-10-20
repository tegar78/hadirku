const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authGuard, adminGuard } = require('../middlewares/auth');

router.get('/', authGuard, shiftController.getAllShifts);
router.post('/', authGuard, adminGuard, shiftController.createShift);
router.put('/:id', authGuard, adminGuard, shiftController.updateShift);
router.delete('/:id', authGuard, adminGuard, shiftController.deleteShift);
router.post('/assign', authGuard, adminGuard, shiftController.assignSchedule);

module.exports = router;
