const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  publicId: {
    type: String,
    required: false,
  },
  pdfUrl: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model("Paper", paperSchema);
