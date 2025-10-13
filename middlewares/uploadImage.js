const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, unique);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
    return cb(new Error('Only images are allowed'), false);
  }
  cb(null, true);
};

const uploadImage = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = uploadImage;
