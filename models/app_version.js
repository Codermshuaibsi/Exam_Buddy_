const mongoose = require('mongoose');

const appVersionSchema = new mongoose.Schema({
    app_name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: 'app_icon.png'
    },
    version: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('AppVersion', appVersionSchema);
