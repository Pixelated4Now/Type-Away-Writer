const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

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

// POST /tags — create a new tag formatted to Title Case
router.post('/tags', authenticateToken, async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tag name is required.' });

    const formatted = name.trim().replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

    try {
        let result = await pool.query(
            'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name',
            [formatted]
        );
        if (result.rows.length === 0) {
            result = await pool.query('SELECT id, name FROM tags WHERE name = $1', [formatted]);
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /tags error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

module.exports = router;
