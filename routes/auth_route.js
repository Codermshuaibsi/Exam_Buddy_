const express = require('express');
const router = express.Router();
const uploadImage = require('../middlewares/uploadImage');
const { register, verifyOTP, login, forgotPassword, verifyResetOTP, resetPassword } = require('../controllers/auth_controller');

// Register with optional profile image (field name: profile)
router.post('/register', uploadImage.single('profile'), register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
