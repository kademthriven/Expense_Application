const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/forgotpassword', userController.forgotPassword);
router.get('/resetpassword/:requestId', userController.getResetPasswordPage);
router.post('/updatepassword/:requestId', userController.updatePassword);

module.exports = router;