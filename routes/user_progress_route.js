const express = require("express");
const router = express.Router();
const progressController = require("../controllers/quiz_progress_controller");

// Save user progress after completing a quiz
// POST /api/progress/save
router.post("/save", progressController.saveProgress);

// Get all progress for a specific user
// GET /api/progress/:userId
router.get("/:userId", progressController.getUserProgress);

module.exports = router;
