const Course = require("../models/course");

//  Add New Course
exports.createCourse = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Course name is required" });
    }

    const existingCourse = await Course.findOne({ name });
    if (existingCourse) {
      return res.status(409).json({ message: "Course already exists" });
    }

    const course = new Course({ name });
    await course.save();

    res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Error creating course", error });
  }
};

// Get All Courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error });
  }
};
