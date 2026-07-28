const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder uploads ada (Gunakan /tmp di Vercel karena filesystem read-only)
const uploadDir = process.env.VERCEL 
  ? '/tmp/uploads' 
  : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Gagal membuat folder uploads:", error);
  }
}

// Konfigurasi penyimpanan multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'produk-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter file hanya untuk gambar
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|webp/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;
