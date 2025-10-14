const User = require('../models/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const cloudinaryInstance = require('../config/cloudinary');
const streamifier = require('streamifier');

exports.register = async (req, res) => {
    const { name, email, password, course, phone } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        let profilePic = undefined;
        let profilePublicId = undefined;

        const profile = req.files;
        if (profile && profile.profilePic) {
            const file = profile.profilePic;
            const stream = cloudinaryInstance.uploader.upload_stream(
                { folder: 'profile_pics' },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                    }
                }
            );
            await new Promise((resolve, reject) => {
                streamifier.createReadStream(file.data)
                    .pipe(stream)
                    .on('finish', resolve)
                    .on('error', reject);
            });
            // Get the uploaded image info from Cloudinary
            const uploadResult = await cloudinaryInstance.uploader.upload_stream.promise;
            profilePic = uploadResult.secure_url;
            profilePublicId = uploadResult.public_id;
        }

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            course,
            phone,
            profilePic,
            profilePublicId,
        });
        // Mail transporter (use a transactional email provider in production)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"CodeWithShuaib " <${process.env.EMAIL_USER}>`,
            to: email,
            subject: ' Verify Your Email - OTP Inside!',
            html: `<div style="font-family:sans-serif;">
              <h2>Hello ${name},</h2>
              <p>Your OTP for email verification is:</p>
              <h1 style="color:#3498db">${otp}</h1>
              <p>Use this to complete your registration.</p>
              <br />
              <p>Thanks,<br/>Team CodeWithShuaib</p>
            </div>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email send error:", error);
                return res.status(500).json({
                    message: 'Failed to send OTP email',
                    error: error.message,
                });
            } else {
                console.log(" Email sent:", info.response);
                return res.status(201).json({ message: 'OTP sent to email' });
            }
        });

    } catch (err) {
        console.error(" Registration error:", err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });

        user.is_verified = true;
        user.otp = null;
        await user.save();
        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        res.status(500).json({ message: 'OTP Verification failed', error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !user.is_verified)
            return res.status(400).json({ message: 'Invalid or unverified user' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Incorrect password' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                course: user.course
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};


// =================== Forgot Password ===================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const otp = generateOTP();
        user.otp = otp;
        await user.save();

        // Mail transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"CodeWithShuaib " <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Password - OTP Inside!',
            html: `<div style="font-family:sans-serif;">
              <h2>Hello ${user.name},</h2>
              <p>Your OTP for password reset is:</p>
              <h1 style="color:#e74c3c">${otp}</h1>
              <p>Use this OTP to reset your password.</p>
              <br />
              <p>Thanks,<br/>Team CodeWithShuaib</p>
            </div>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return res.status(500).json({ message: 'Failed to send reset OTP', error: error.message });
            res.status(200).json({ message: 'OTP sent to email for password reset' });
        });

    } catch (err) {
        res.status(500).json({ message: 'Forgot password failed', error: err.message });
    }
};

// =================== Verify Reset OTP ===================
exports.verifyResetOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });

        user.is_reset_verified = true;
        await user.save();

        res.json({ message: 'OTP verified, you can now reset password' });
    } catch (err) {
        res.status(500).json({ message: 'OTP verification failed', error: err.message });
    }
};

// =================== Reset Password ===================
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !user.is_reset_verified)
            return res.status(400).json({ message: 'Unauthorized reset attempt' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.otp = null;
        user.is_reset_verified = true;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Password reset failed', error: err.message });
    }
};

