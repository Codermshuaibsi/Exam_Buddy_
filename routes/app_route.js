const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadImage');
const {
    checkVersion,
    updateVersion,
    createApp
} = require('../controllers/app_version_controller');

// Create new app (upload image)
router.post('/create', upload.single('image'), createApp);

// Check app version
router.post('/check', checkVersion);

// Update version (optional image)
router.post('/update', upload.single('image'), updateVersion);

module.exports = router;
