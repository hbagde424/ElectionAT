const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'visit-docs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9\-]/gi, '_');
    const unique = Date.now();
    cb(null, `visit-${base}-${unique}${ext}`);
  }
});

// Allow any file type (user requested documents of any type)
const fileFilter = function (req, file, cb) {
  cb(null, true);
};

const limits = {
  fileSize: 15 * 1024 * 1024 // 15 MB per file
};

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;
