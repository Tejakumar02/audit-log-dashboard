const multer = require('multer');

// The file is parsed once and discarded - it never needs to touch disk,
// so memory storage is the simplest correct choice here.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB comfortably covers 10k records
  fileFilter(req, file, cb) {
    const isJson =
      file.mimetype === 'application/json' || file.originalname.toLowerCase().endsWith('.json');
    if (!isJson) {
      return cb(new Error('Only .json files are accepted.'));
    }
    cb(null, true);
  },
});

module.exports = upload;
