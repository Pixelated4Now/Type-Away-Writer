const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /categories — all categories ordered by name
router.get('/categories', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, image_path FROM categories ORDER BY name ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /categories error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET /tags — all tags ordered by name
router.get('/tags', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name FROM tags ORDER BY name ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /tags error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

module.exports = router;
