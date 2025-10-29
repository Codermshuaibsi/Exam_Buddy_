const Paper = require("../models/paper");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const https = require("https");
const streamifier = require("streamifier")

exports.uploadPaper = async (req, res) => {
  try {
    const { subjectId, year, ytUrl } = req.body;

    // Check files
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ success: false, message: "PDF file is required" });
    }

    // Helper function for uploading buffers to Cloudinary
    const uploadToCloudinary = (buffer, folder) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    // Upload PDF and masterPdf
    const pdfResult = await uploadToCloudinary(req.files.pdf[0].buffer, "papers");
    let masterResult = null;
    if (req.files.masterPdf) {
      masterResult = await uploadToCloudinary(req.files.masterPdf[0].buffer, "masterPapers");
    }

    // Save to MongoDB
    const newPaper = new Paper({
      subject: subjectId,
      year,
      ytUrl,
      pdfUrl: pdfResult.secure_url,
      masterPdfUrl: masterResult ? masterResult.secure_url : null,
    });

    await newPaper.save();

    res.status(200).json({
      success: true,
      message: "Paper uploaded successfully",
      data: newPaper,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
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
