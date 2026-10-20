const express = require('express');
const router = express.Router();
const officeController = require('../controllers/officeController');
const { authGuard, adminGuard } = require('../middlewares/auth');

router.get('/', authGuard, officeController.getOfficeSettings);
router.put('/', authGuard, adminGuard, officeController.updateOfficeSettings);

module.exports = router;
