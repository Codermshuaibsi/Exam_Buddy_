const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const {
  uploadPaper,
  getPaperById,
  getPapersBySubject,
  getSignedUrl,
  streamSignedPaper,
} = require("../controllers/paper_controller");

router.post(
  "/upload",
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "masterPdf", maxCount: 1 }
  ]),
  uploadPaper
);
// list by subject
router.get("/:subjectId", getPapersBySubject);
// signed url (generate signed link)
router.get("/:paperId/signed", getSignedUrl);
// server-side streaming (supports Range)
router.get("/:paperId/stream", streamSignedPaper);
// get paper
router.get("/:paperId", getPaperById);

module.exports = router;
