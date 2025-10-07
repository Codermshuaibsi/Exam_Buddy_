const Paper = require("../models/paper");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// ✅ Upload Paper (PDF)
exports.uploadPaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    const { subjectId, year } = req.body;

    if (!subjectId || !year) {
      return res.status(400).json({ message: "Subject ID and year are required" });
    }

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
      folder: "exam_papers",
    });

    // ✅ Save to DB
    const paper = new Paper({
      subject: subjectId,
      year,
      pdfUrl: result.secure_url,
    });

    await paper.save();

    // ✅ Remove local temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: "Paper uploaded successfully",
      paper,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// ✅ Get papers by subject
exports.getPapersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const papers = await Paper.find({ subject: subjectId }).sort({ year: -1 });
    res.status(200).json(papers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching papers", error });
  }
};
