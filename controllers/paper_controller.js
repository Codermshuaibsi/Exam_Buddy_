const Paper = require("../models/paper");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const https = require("https");

// Upload Paper Controller - stores publicId and secure_url
exports.uploadPaper = async (req, res) => {
  try {
    const { subjectId, year } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: "No PDF file provided" });
    if (!subjectId || !year) return res.status(400).json({ success: false, message: "Subject ID and year are required" });

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: "papers",
    });

    try { fs.unlinkSync(req.file.path); } catch (e) {}

    const newPaper = new Paper({
      subject: subjectId,
      year,
      pdfUrl: uploadResult.secure_url,
     });

    await newPaper.save();

    res.status(201).json({ success: true, message: "Paper uploaded", paper: newPaper });
  } catch (error) {
    console.error("Error uploading paper:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get Papers by Subject
exports.getPapersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!subjectId) return res.status(400).json({ success: false, message: "Subject ID is required" });

    const papers = await Paper.find({ subject: subjectId }).populate("subject", "name").sort({ year: -1 });
    res.status(200).json({ success: true, count: papers.length, papers });
  } catch (error) {
    console.error("Error fetching papers:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get single paper by id
exports.getPaperById = async (req, res) => {
  try {
    const { paperId } = req.params;
    if (!paperId) return res.status(400).json({ success: false, message: "Paper ID is required" });

    const paper = await Paper.findById(paperId).populate("subject", "name");
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });

    res.status(200).json({ success: true, paper });
  } catch (error) {
    console.error("Error getting paper:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Generate signed URL for restricted assets
exports.getSignedUrl = async (req, res) => {
  try {
    const { paperId } = req.params;
    if (!paperId) return res.status(400).json({ success: false, message: "Paper ID is required" });

    const paper = await Paper.findById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });
    if (!paper.publicId) return res.status(400).json({ success: false, message: "No publicId stored" });

    const signedUrl = cloudinary.url(paper.publicId, { resource_type: "raw", type: "authenticated", sign_url: true });
    res.status(200).json({ success: true, signedUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Stream signed asset server-side with Range support (so browser can seek)
exports.streamSignedPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    if (!paperId) return res.status(400).json({ success: false, message: "Paper ID is required" });

    const paper = await Paper.findById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });
    if (!paper.publicId) return res.status(400).json({ success: false, message: "No publicId stored" });

    const signedUrl = cloudinary.url(paper.publicId, { resource_type: "raw", type: "authenticated", sign_url: true });

    // Support Range header for partial requests
    const range = req.headers.range;

    // We'll make a GET request to signedUrl and pipe response. Cloudinary supports Range headers.
    const options = new URL(signedUrl);
    const requestOptions = {
      method: "GET",
      headers: {}
    };
    if (range) requestOptions.headers.Range = range;

    https.get(options, (cloudRes) => {
      const { statusCode, headers } = cloudRes;
      console.log(`Cloud fetch status: ${statusCode}`);
      console.log(headers);

      if (statusCode && statusCode >= 400) {
        res.status(statusCode).json({ success: false, message: `Remote returned ${statusCode}` });
        cloudRes.destroy();
        return;
      }

      // Forward important headers
      if (headers["content-type"]) res.setHeader("Content-Type", headers["content-type"]);
      if (headers["content-disposition"]) res.setHeader("Content-Disposition", headers["content-disposition"]);
      if (headers["content-length"]) res.setHeader("Content-Length", headers["content-length"]);
      if (headers["accept-ranges"]) res.setHeader("Accept-Ranges", headers["accept-ranges"]);
      if (headers["content-range"]) res.setHeader("Content-Range", headers["content-range"]);

      // Stream bytes to client
      cloudRes.pipe(res);
    }).on("error", (err) => {
      console.error("Error fetching signed URL:", err);
      if (!res.headersSent) res.status(500).json({ success: false, message: "Error fetching signed URL", error: err.message });
    });
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
