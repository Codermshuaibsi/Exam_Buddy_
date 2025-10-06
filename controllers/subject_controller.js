const Subject = require("../models/subject");

// ✅ Add New Subject
exports.createSubject = async (req, res) => {
  try {
    const { semesterId, name } = req.body;

    if (!semesterId || !name) {
      return res.status(400).json({ message: "Semester ID and name are required" });
    }

    const subject = new Subject({ semester: semesterId, name });
    await subject.save();

    res.status(201).json({ message: "Subject created successfully", subject });
  } catch (error) {
    res.status(500).json({ message: "Error creating subject", error });
  }
};

// ✅ Get Subjects by Semester
exports.getSubjectsBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const subjects = await Subject.find({ semester: semesterId });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subjects", error });
  }
};
