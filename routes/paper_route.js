const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const {
  uploadPaper,
  getPapersBySubject,
} = require("../controllers/paper_controller");

router.post("/upload", upload.single("pdf"), uploadPaper);
router.get("/:subjectId", getPapersBySubject);

module.exports = router;
