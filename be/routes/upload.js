const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Tells Multer how to handle a file once it arrives at the server.
const makeStorage = (subdir) => multer.diskStorage({
    // Where to save the uploaded file.
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', subdir);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    // Create unique filename for every uploaded file to prevent collisions.
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});

// Checks the MIME type of file.
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'), false);
};

// POST request to save cover image.
router.post('/cover', authenticateToken, multer({ storage: makeStorage('covers'), fileFilter: imageFilter }).single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    res.json({ url: `/uploads/covers/${req.file.filename}` });
});

// POST request to accept inline image for story chapter.
router.post('/image', authenticateToken, multer({ storage: makeStorage('images'), fileFilter: imageFilter }).single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    res.json({ url: `/uploads/images/${req.file.filename}` });
});

// POST request to save profile photo.
router.post('/avatar', authenticateToken, multer({ storage: makeStorage('avatars'), fileFilter: imageFilter }).single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    res.json({ url: `/uploads/avatars/${req.file.filename}` });
});

// POST request to save header image.
router.post('/header', authenticateToken, multer({ storage: makeStorage('headers'), fileFilter: imageFilter }).single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    res.json({ url: `/uploads/headers/${req.file.filename}` });
});

module.exports = router;
