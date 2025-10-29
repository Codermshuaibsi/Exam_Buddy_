const AppVersion = require('../models/app_version');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// ========== Upload to Cloudinary Helper ==========
const uploadToCloudinary = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folderName },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

// ========== Check App Version ==========
exports.checkVersion = async (req, res) => {
    try {
        const { app_id, version } = req.body;

        const app = await AppVersion.findById(app_id);
        if (!app) {
            return res.status(404).json({
                message: 'App not found',
                success: false
            });
        }

        const isUpToDate = app.version === version;

        res.json({
            data: {
                app_id: app._id,
                app_name: app.app_name,
                image: app.image,
                version: app.version,
            },
            message: isUpToDate ? 'App is up to date.' : 'Update available.',
            success: true,
            update_required: !isUpToDate
        });

    } catch (err) {
        res.status(500).json({ message: err.message, success: false });
    }
};

// ========== Update App Version ==========
exports.updateVersion = async (req, res) => {
    try {
        const { app_id, version } = req.body;
        const app = await AppVersion.findById(app_id);

        if (!app) {
            return res.status(404).json({
                message: 'App not found',
                success: false
            });
        }

        // If a new image file is provided, upload it
        if (req.file) {
            const imageUrl = await uploadToCloudinary(req.file.buffer, 'ExamBuddy/AppIcons');
            app.image = imageUrl;
        }

        app.version = version;
        await app.save();

        res.json({
            data: {
                app_id: app._id,
                app_name: app.app_name,
                image: app.image,
                version: app.version
            },
            message: 'App updated.',
            success: true
        });

    } catch (err) {
        res.status(500).json({ message: err.message, success: false });
    }
};

// ========== Create App (first-time setup) ==========
exports.createApp = async (req, res) => {
    try {
        const { app_name, version } = req.body;
        let imageUrl = null;

        // Upload image to Cloudinary if provided
        if (req.file) {
            imageUrl = await uploadToCloudinary(req.file.buffer, 'ExamBuddy/AppIcons');
        }

        const app = await AppVersion.create({
            app_name,
            image: imageUrl || 'https://via.placeholder.com/150',
            version
        });

        res.status(201).json({
            message: 'App created successfully',
            data: app,
            success: true
        });

    } catch (err) {
        res.status(500).json({ message: err.message, success: false });
    }
};
