const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authGuard, adminGuard } = require('../middlewares/auth');

router.get('/', authGuard, adminGuard, employeeController.getAllEmployees);
router.post('/', authGuard, adminGuard, employeeController.createEmployee);
router.put('/:id', authGuard, adminGuard, employeeController.updateEmployee);
router.delete('/:id', authGuard, adminGuard, employeeController.deleteEmployee);
router.put('/:id/reset-device', authGuard, adminGuard, employeeController.resetDevice);

module.exports = router;
