const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { authenticateToken } = require('../middleware/auth');

const makeStorage = (subdir) => multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', subdir);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'), false);
};

router.post('/cover', authenticateToken, multer({ storage: makeStorage('covers'), fileFilter: imageFilter }).single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    res.json({ url: `/uploads/covers/${req.file.filename}` });
});

router.post('/image', authenticateToken, multer({ storage: makeStorage('images'), fileFilter: imageFilter }).single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    res.json({ url: `/uploads/images/${req.file.filename}` });
});

router.post('/avatar', authenticateToken, multer({ storage: makeStorage('avatars'), fileFilter: imageFilter }).single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    res.json({ url: `/uploads/avatars/${req.file.filename}` });
});

router.post('/header', authenticateToken, multer({ storage: makeStorage('headers'), fileFilter: imageFilter }).single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    res.json({ url: `/uploads/headers/${req.file.filename}` });
});

module.exports = router;
