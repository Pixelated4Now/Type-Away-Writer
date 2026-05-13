const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /users/experts?username= — search verified language experts
router.get('/experts', authenticateToken, async (req, res) => {
    const { username = '' } = req.query;
    try {
        const { rows } = await pool.query(
            `SELECT id, username FROM users
             WHERE account_type = 'expert' AND is_expert_verified = TRUE
             AND LOWER(username) LIKE $1
             ORDER BY username ASC
             LIMIT 10`,
            [`%${username.toLowerCase()}%`]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /users/experts error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

module.exports = router;
