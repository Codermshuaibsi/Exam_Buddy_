// middlewares/uploadImage.js
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // ✅ No destination or filename needed

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
    return cb(new Error('Only .png, .jpg and .jpeg files are allowed'), false);
  }
  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

module.exports = uploadImage;
