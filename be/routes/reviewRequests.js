const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /review-requests — all requests assigned to the logged-in expert
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT
                rr.id,
                rr.story_id,
                rr.status,
                rr.created_at,
                s.title        AS story_title,
                u.username     AS student_username
             FROM review_requests rr
             JOIN stories s ON s.id = rr.story_id
             JOIN users   u ON u.id = rr.student_id
             WHERE rr.expert_id = $1
             ORDER BY rr.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /review-requests error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// PATCH /review-requests/:id — update status
router.patch('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['new', 'reviewed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
    }
    try {
        const { rowCount } = await pool.query(
            'UPDATE review_requests SET status = $1 WHERE id = $2 AND expert_id = $3',
            [status, id, req.user.id]
        );
        if (rowCount === 0) return res.status(404).json({ message: 'Not found.' });
        res.json({ message: 'Updated.' });
    } catch (err) {
        console.error('PATCH /review-requests/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// DELETE /review-requests/:id — remove the request
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM review_requests WHERE id = $1 AND expert_id = $2',
            [id, req.user.id]
        );
        if (rowCount === 0) return res.status(404).json({ message: 'Not found.' });
        res.status(204).send();
    } catch (err) {
        console.error('DELETE /review-requests/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

module.exports = router;
