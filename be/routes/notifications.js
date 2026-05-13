const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /notifications — latest 30 for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT
                n.id, n.type, n.is_read, n.created_at,
                a.username  AS actor_username,
                a.avatar_url AS actor_avatar,
                s.title     AS story_title,
                s.id        AS story_id
             FROM notifications n
             LEFT JOIN users   a ON a.id = n.actor_id
             LEFT JOIN stories s ON s.id = n.story_id
             WHERE n.user_id = $1
             ORDER BY n.created_at DESC
             LIMIT 30`,
            [req.user.id]
        );
        const unread = rows.filter(r => !r.is_read).length;
        res.json({ notifications: rows, unread });
    } catch (err) {
        console.error('GET /notifications error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// POST /notifications/mark-read — mark all unread as read
router.post('/mark-read', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
            [req.user.id]
        );
        res.json({ message: 'Notifications marked as read.' });
    } catch (err) {
        console.error('POST /notifications/mark-read error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

module.exports = router;
