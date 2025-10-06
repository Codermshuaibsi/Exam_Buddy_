const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model("Subject", subjectSchema);
