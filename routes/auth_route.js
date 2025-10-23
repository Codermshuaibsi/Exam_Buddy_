const express = require('express');
const router = express.Router();

const {
    register,
    verifyOTP,
    login,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    getUserProfile,
    updateUserProfile
} = require('../controllers/auth_controller');

const uploadImage = require('../middlewares/uploadImage');

// Existing routes...
router.post('/register', uploadImage.single('profile'), register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);
router.get('/profile/:id', getUserProfile);
router.put('/profile/:id', uploadImage.single('profile'), updateUserProfile);

module.exports = router;
