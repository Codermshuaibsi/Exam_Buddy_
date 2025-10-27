const User = require('../models/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const cloudinaryInstance = require('../config/cloudinary');
const streamifier = require('streamifier');
const Sib = require('sib-api-v3-sdk');


// ===== Temporary Store (Could be Redis or simple in-memory for now) =====
const tempUsers = {}; // { email: { name, password, course, phone, otp, profilePic, profilePublicId } }

// ============ Register (But Don't Save to DB Yet) ============
exports.register = async (req, res) => {
    const { name, email, password, course, phone } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        let profilePic = undefined;
        let profilePublicId = undefined;

        if (req.files?.profilePic) {
            const file = req.files.profilePic;
            const uploadResult = await new Promise((resolve, reject) => {
                cloudinaryInstance.uploader.upload_stream(
                    { folder: "profile_pics" },
                    (error, result) => error ? reject(error) : resolve(result)
                ).end(file.data);
            });

            profilePic = uploadResult.secure_url;
            profilePublicId = uploadResult.public_id;
        }

        // ✅ Save user temporarily (not in database yet)
        tempUsers[email] = {
            name,
            password: hashedPassword,
            course,
            phone,
            otp,
            profilePic,
            profilePublicId
        };

        res.status(201).json({ message: 'OTP sent to email' });

        // ✅ Send OTP via email (same as before)
        (async () => {
            try {
                const client = Sib.ApiClient.instance;
                client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
                const tranEmailApi = new Sib.TransactionalEmailsApi();

                await tranEmailApi.sendTransacEmail({
                    sender: { email: process.env.EMAIL_USER, name: "CodeWithShuaib" },
                    to: [{ email }],
                    subject: "Verify Your Email - OTP Inside!",
                    htmlContent: `<div style="font-family:sans-serif;">
                      <h2>Hello ${name},</h2>
                      <p>Your OTP for email verification is:</p>
                      <h1 style="color:#3498db">${otp}</h1>
                      <p>Use this to complete your registration.</p>
                      <br />
                      <p>Thanks,<br/>Team CodeWithShuaib</p>
                    </div>`,
                });

            } catch (emailErr) {
                console.error("  Email sending failed:", emailErr);
            }
        })();

    } catch (err) {
        console.error("  Registration error:", err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

// ============ Verify OTP & Then Save to DB ============
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const tempUser = tempUsers[email];
        if (!tempUser || tempUser.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP or session expired' });
        }

        // ✅ Create user in database only after OTP is verified
        const newUser = await User.create({
            name: tempUser.name,
            email,
            password: tempUser.password,
            course: tempUser.course,
            phone: tempUser.phone,
            profilePic: tempUser.profilePic,
            profilePublicId: tempUser.profilePublicId,
            is_verified: true
        });

        // ✅ Clear temp entry
        delete tempUsers[email];

        res.json({ message: 'Email verified and account created ✅' });

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
                course: user.course,
                profilePic: user.profilePic
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};


// =================== Forgot Password ===================
// =================== Forgot Password ===================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const otp = generateOTP();
        user.otp = otp;
        await user.save();

        // ✅ Send OTP via Brevo (SIB) same as register
        (async () => {
            try {
                const client = Sib.ApiClient.instance;
                client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

                const tranEmailApi = new Sib.TransactionalEmailsApi();

                await tranEmailApi.sendTransacEmail({
                    sender: { email: process.env.EMAIL_USER, name: "CodeWithShuaib" },
                    to: [{ email }],
                    subject: "Reset Password - OTP Inside!",
                    htmlContent: `<div style="font-family:sans-serif;">
                      <h2>Hello ${user.name},</h2>
                      <p>Your OTP for password reset is:</p>
                      <h1 style="color:#e74c3c">${otp}</h1>
                      <p>Use this OTP to reset your password.</p>
                      <br />
                      <p>Thanks,<br/>Team CodeWithShuaib</p>
                    </div>`,
                });

                console.log("✅ Reset OTP sent via Brevo API");
            } catch (emailErr) {
                console.error("❌ Reset OTP email sending failed:", emailErr);
            }
        })();

        res.status(200).json({ message: 'OTP sent to email for password reset' });

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

// =================== Get User Profile ===================
exports.getUserProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).select('-password -otp');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
    }
};


// =================== Update User Profile ===================
exports.updateUserProfile = async (req, res) => {
    const { id } = req.params;
    const { name, phone, course } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // ✅ Handle profile image update
        if (req.file) {
            // If user already has an image, delete old one from Cloudinary
            if (user.profilePublicId) {
                await cloudinaryInstance.uploader.destroy(user.profilePublicId);
            }

            // Upload new image
            const uploadResult = await new Promise((resolve, reject) => {
                cloudinaryInstance.uploader.upload_stream(
                    { folder: "profile_pics" },
                    (error, result) => error ? reject(error) : resolve(result)
                ).end(req.file.buffer);
            });

            user.profilePic = uploadResult.secure_url;
            user.profilePublicId = uploadResult.public_id;
        }

        // Update text fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (course) user.course = course;

        await user.save();

        res.json({ message: 'Profile updated successfully ', user });
    } catch (err) {
        res.status(500).json({ message: 'Profile update failed', error: err.message });
    }
};
