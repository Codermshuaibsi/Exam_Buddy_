const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },

    otp: String,

    is_verified: {
        type: Boolean,
        default: false,
    },
    course: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    is_reset_verified: {
        type: Boolean,
        default: false,
    },
    profilePic: {
        type: String,
    },
    profilePublicId: {
        type: String,
    },
},
    { timestamps: true })

module.exports = mongoose.model('UserModel', userSchema);