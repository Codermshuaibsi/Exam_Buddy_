const express = require("express");
const router = express.Router();
const {
  createSubject,
  getSubjectsBySemester,
} = require("../controllers/subject_controller");

router.post("/add", createSubject);
router.get("/:semesterId", getSubjectsBySemester);

module.exports = router;
