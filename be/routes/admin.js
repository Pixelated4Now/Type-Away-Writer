const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const guard = [authenticateToken, requireRole('admin')];

const toTitleCase = (str) =>
    str.trim().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

// ── GET /admin/stats ──────────────────────────────────────────────────────────

router.get('/stats', guard, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                (SELECT COUNT(*)::int FROM users)                                AS total_users,
                (SELECT COUNT(*)::int FROM users WHERE account_type = 'student') AS total_students,
                (SELECT COUNT(*)::int FROM users WHERE account_type = 'expert')  AS total_experts,
                (SELECT COUNT(*)::int FROM stories WHERE status = 'published')   AS total_stories
        `);
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /admin/stats error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /admin/stats/stories-over-time ────────────────────────────────────────

router.get('/stats/stories-over-time', guard, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            WITH months AS (
                SELECT generate_series(
                    DATE_TRUNC('year', NOW()),
                    DATE_TRUNC('year', NOW()) + INTERVAL '11 months',
                    INTERVAL '1 month'
                ) AS m
            ),
            counts AS (
                SELECT DATE_TRUNC('month', created_at) AS m, COUNT(*)::int AS cnt
                FROM stories
                WHERE status = 'published'
                  AND EXTRACT(year FROM created_at) = EXTRACT(year FROM NOW())
                GROUP BY DATE_TRUNC('month', created_at)
            )
            SELECT TO_CHAR(months.m, 'Mon') AS month, COALESCE(counts.cnt, 0) AS count
            FROM months
            LEFT JOIN counts USING (m)
            ORDER BY months.m
        `);
        res.json(rows);
    } catch (err) {
        console.error('GET /admin/stats/stories-over-time error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /admin/stats/stories-by-category ─────────────────────────────────────

router.get('/stats/stories-by-category', guard, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT cat.name, COUNT(s.id)::int AS value
            FROM categories cat
            JOIN stories s ON s.category_id = cat.id AND s.status = 'published'
            GROUP BY cat.name
            ORDER BY value DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('GET /admin/stats/stories-by-category error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /admin/stats/collaboration ────────────────────────────────────────────

router.get('/stats/collaboration', guard, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                COUNT(*)::int FILTER (WHERE sc_count = 0) AS individual,
                COUNT(*)::int FILTER (WHERE sc_count > 0) AS collaborated
            FROM (
                SELECT s.id, COUNT(sc.user_id) AS sc_count
                FROM stories s
                LEFT JOIN story_collaborators sc ON sc.story_id = s.id
                WHERE s.status = 'published'
                GROUP BY s.id
            ) t
        `);
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /admin/stats/collaboration error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /admin/users?type=student|expert ─────────────────────────────────────

router.get('/users', guard, async (req, res) => {
    const { type } = req.query;
    if (type !== 'student' && type !== 'expert') {
        return res.status(400).json({ message: 'type must be student or expert.' });
    }
    try {
        let rows;
        if (type === 'student') {
            ({ rows } = await pool.query(`
                SELECT u.id, u.username, u.email, u.created_at, u.is_active,
                       COUNT(s.id)::int AS story_count
                FROM users u
                LEFT JOIN stories s ON s.author_id = u.id AND s.status = 'published'
                WHERE u.account_type = 'student'
                GROUP BY u.id
                ORDER BY u.created_at DESC
            `));
        } else {
            ({ rows } = await pool.query(`
                SELECT u.id, u.username, u.email, u.created_at, u.is_active,
                       COUNT(rr.id)::int AS review_count
                FROM users u
                LEFT JOIN review_requests rr ON rr.expert_id = u.id
                WHERE u.account_type = 'expert'
                GROUP BY u.id
                ORDER BY u.created_at DESC
            `));
        }
        res.json(rows);
    } catch (err) {
        console.error('GET /admin/users error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── PATCH /admin/users/:id/suspend ────────────────────────────────────────────

router.patch('/users/:id/suspend', guard, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
            [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ message: 'User not found.' });
        res.json(rows[0]);
    } catch (err) {
        console.error('PATCH /admin/users/:id/suspend error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /admin/stories ────────────────────────────────────────────────────────

router.get('/stories', guard, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT s.id, s.title, u.username AS author,
                   cat.name AS category, s.status
            FROM stories s
            JOIN users u ON u.id = s.author_id
            LEFT JOIN categories cat ON cat.id = s.category_id
            WHERE s.status = 'published'
            ORDER BY s.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('GET /admin/stories error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── DELETE /admin/stories/:id ─────────────────────────────────────────────────

router.delete('/stories/:id', guard, async (req, res) => {
    try {
        await pool.query('DELETE FROM stories WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /admin/stories/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /admin/tags ───────────────────────────────────────────────────────────

router.get('/tags', guard, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM tags ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error('GET /admin/tags error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /admin/tags ──────────────────────────────────────────────────────────

router.post('/tags', guard, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });
    const titled = toTitleCase(name);
    try {
        const { rows } = await pool.query(
            'INSERT INTO tags (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *',
            [titled]
        );
        if (rows.length === 0) {
            // Already exists — return the existing row
            const existing = await pool.query('SELECT * FROM tags WHERE LOWER(name) = LOWER($1)', [titled]);
            return res.json(existing.rows[0]);
        }
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /admin/tags error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── DELETE /admin/tags/:id ────────────────────────────────────────────────────

router.delete('/tags/:id', guard, async (req, res) => {
    try {
        await pool.query('DELETE FROM tags WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /admin/tags/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /admin/categories ─────────────────────────────────────────────────────

router.get('/categories', guard, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT cat.id, cat.name, COUNT(s.id)::int AS story_count
            FROM categories cat
            LEFT JOIN stories s ON s.category_id = cat.id AND s.status = 'published'
            GROUP BY cat.id, cat.name
            ORDER BY cat.name
        `);
        res.json(rows);
    } catch (err) {
        console.error('GET /admin/categories error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /admin/categories ────────────────────────────────────────────────────

router.post('/categories', guard, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });
    try {
        const { rows } = await pool.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name.trim()]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /admin/categories error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── PUT /admin/categories/:id ─────────────────────────────────────────────────

router.put('/categories/:id', guard, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });
    try {
        const { rows } = await pool.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [name.trim(), req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ message: 'Category not found.' });
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /admin/categories/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── DELETE /admin/categories/:id ──────────────────────────────────────────────

router.delete('/categories/:id', guard, async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /admin/categories/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /admin/admins ─────────────────────────────────────────────────────────

router.get('/admins', guard, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, username, email, created_at
             FROM users WHERE account_type = 'admin'
             ORDER BY created_at`
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /admin/admins error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

module.exports = router;
