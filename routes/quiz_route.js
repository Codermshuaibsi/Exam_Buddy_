const express = require("express");
const router = express.Router();
const { generate_quiz, get_quiz } = require("../controllers/quiz_controller");

// POST - generate quiz for subject + level
router.post("/generate", generate_quiz);

// GET - get quiz based on filters (course, semester, subject, level)
router.get("/", get_quiz);

module.exports = router;
