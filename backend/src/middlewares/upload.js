const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
const selfiesDir = path.join(uploadsDir, 'selfies');
const leavesDir = path.join(uploadsDir, 'leaves');

[uploadsDir, selfiesDir, leavesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for Attendance Selfie
const selfieStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, selfiesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `selfie-${req.user ? req.user.id : 'anon'}-${uniqueSuffix}${ext}`);
  },
});

// Storage for Leave Attachments (PDF / JPG / PNG)
const leaveStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, leavesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `leave-${req.user ? req.user.id : 'anon'}-${uniqueSuffix}${ext}`);
  },
});

const fileFilterImageOnly = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Harap upload foto selfie JPG, PNG, atau WebP.'), false);
  }
};

const fileFilterDocAndImage = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file surat tidak didukung. Harap upload PDF, JPG, atau PNG.'), false);
  }
};

const uploadSelfie = multer({
  storage: selfieStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB max
  fileFilter: fileFilterImageOnly,
});

const uploadLeaveAttachment = multer({
  storage: leaveStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB max
  fileFilter: fileFilterDocAndImage,
});

module.exports = {
  uploadSelfie,
  uploadLeaveAttachment,
};
