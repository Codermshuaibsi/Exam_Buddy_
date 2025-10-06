const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model("Semester", semesterSchema);
