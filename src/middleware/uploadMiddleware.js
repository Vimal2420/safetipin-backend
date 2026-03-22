import multer from 'multer';
import path from 'path';

// Set storage engine
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check File Type
function checkFileType(file, cb) {
  console.log(`[Multer] Checking file: ${file.originalname} (${file.mimetype})`);
  // Allowed ext
  const filetypes = /jpg|jpeg|png|mp4|mov|avi|mkv|aac|m4a|wav|mp3|mpeg/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    console.log(`[Multer] Rejected: ext=${extname}, mime=${mimetype}`);
    cb('Error: Images, Videos, and Audio only!');
  }
}

// Init upload
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB limit for video proof
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;
