const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Setup storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Load photos from file
let photos = [];
const photosFile = path.join(dataDir, 'photos.json');
if (fs.existsSync(photosFile)) {
  photos = JSON.parse(fs.readFileSync(photosFile));
} else {
  fs.writeFileSync(photosFile, JSON.stringify([], null, 2));
}

// Save photos to file
function savePhotos() {
  fs.writeFileSync(photosFile, JSON.stringify(photos, null, 2));
}

// Endpoint to upload photo with description and author
router.post('/upload-photo', upload.single('photo'), (req, res) => {
  try {
    const { description, author } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Photo file is required' });
    }
    if (!description || !author) {
      return res.status(400).json({ message: 'Description and author are required' });
    }
    // Create text file with description and author
    const baseName = req.file.filename.replace(/\.[^/.]+$/, "");
    const textFilename = baseName + '.txt';
    const textPath = path.join(__dirname, 'uploads', textFilename);
    const textContent = `Description: ${description}\nAuthor: ${author}`;
    fs.writeFileSync(textPath, textContent);

    const photoData = {
      id: photos.length + 1,
      filename: req.file.filename,
      textFilename,
      description,
      author,
      path: '/uploads/' + req.file.filename,
      textPath: '/uploads/' + textFilename
    };
    photos.push(photoData);
    savePhotos();
    res.json({ message: 'Photo uploaded successfully', photo: photoData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to get all uploaded photos
router.get('/photos', (req, res) => {
  res.json({ photos });
});

module.exports = router;
