const Semester = require("../models/semester");

// ✅ Add New Semester
exports.createSemester = async (req, res) => {
  try {
    const { courseId, name } = req.body;

    if (!courseId || !name) {
      return res.status(400).json({ message: "Course ID and name are required" });
    }

    const semester = new Semester({ course: courseId, name });
    await semester.save();

    res.status(201).json({ message: "Semester created successfully", semester });
  } catch (error) {
    res.status(500).json({ message: "Error creating semester", error });
  }
};

// ✅ Get Semesters by Course
exports.getSemestersByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const semesters = await Semester.find({ course: courseId });
    res.status(200).json(semesters);
  } catch (error) {
    res.status(500).json({ message: "Error fetching semesters", error });
  }
};
