const express = require("express");
const router = express.Router();
const {
  createSemester,
  getSemestersByCourse,
} = require("../controllers/semester_controller");

router.post("/add", createSemester);
router.get("/:courseId", getSemestersByCourse);

module.exports = router;
