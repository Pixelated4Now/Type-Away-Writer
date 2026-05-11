const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// ── Shared SQL fragments ──────────────────────────────────────────────────────

// Returns the tags array for a given story_id
const TAGS_SUBQ = `
    COALESCE(
        (SELECT ARRAY_AGG(t.name ORDER BY t.name)
         FROM story_tags st JOIN tags t ON st.tag_id = t.id
         WHERE st.story_id = s.id),
        ARRAY[]::TEXT[]
    )`;

// Returns the authors array (original author + collaborators) for a given story_id
const AUTHORS_SUBQ = `
    (SELECT ARRAY_AGG(u.username ORDER BY u.username)
     FROM (
         SELECT s2.author_id AS uid FROM stories s2 WHERE s2.id = s.id
         UNION
         SELECT sc.user_id FROM story_collaborators sc WHERE sc.story_id = s.id
     ) combined
     JOIN users u ON u.id = combined.uid)`;

// ── GET /stories ──────────────────────────────────────────────────────────────

router.get('/stories', optionalAuth, async (req, res) => {
    const { category_id, title, author, tags: tagsParam, status } = req.query;

    const params = [];
    let p = 1;
    const conditions = [];

    // Status: default to published only; honour explicit filter
    if (status === 'complete') {
        conditions.push(`s.status = $${p++}`);
        params.push('published');
    } else if (status === 'ongoing') {
        conditions.push(`s.status = $${p++}`);
        params.push('draft');
    } else {
        conditions.push(`s.status = 'published'`);
    }

    if (category_id) {
        conditions.push(`s.category_id = $${p++}`);
        params.push(parseInt(category_id, 10));
    }

    if (title) {
        conditions.push(`LOWER(s.title) LIKE $${p++}`);
        params.push(`%${title.toLowerCase()}%`);
    }

    if (author) {
        conditions.push(`EXISTS (
            SELECT 1 FROM (
                SELECT s2.author_id AS uid FROM stories s2 WHERE s2.id = s.id
                UNION
                SELECT sc.user_id FROM story_collaborators sc WHERE sc.story_id = s.id
            ) combined
            JOIN users u ON u.id = combined.uid
            WHERE LOWER(u.username) LIKE $${p++}
        )`);
        params.push(`%${author.toLowerCase()}%`);
    }

    const tagNames = tagsParam
        ? tagsParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];
    if (tagNames.length > 0) {
        conditions.push(`(
            SELECT COUNT(DISTINCT LOWER(t.name))
            FROM story_tags st JOIN tags t ON st.tag_id = t.id
            WHERE st.story_id = s.id AND LOWER(t.name) = ANY($${p++})
        ) = $${p++}`);
        params.push(tagNames);
        params.push(tagNames.length);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const { rows } = await pool.query(`
            SELECT
                s.id, s.title, s.summary, s.cover_image_url, s.status,
                s.likes_count, s.created_at,
                ${TAGS_SUBQ}    AS tags,
                ${AUTHORS_SUBQ} AS authors,
                (SELECT COUNT(*)::INT FROM chapters  WHERE story_id = s.id) AS chapter_count,
                (SELECT COUNT(*)::INT FROM comments  WHERE story_id = s.id) AS comment_count
            FROM stories s
            ${where}
            ORDER BY s.likes_count DESC
        `, params);
        res.json(rows);
    } catch (err) {
        console.error('GET /stories error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /stories/:id ──────────────────────────────────────────────────────────

router.get('/stories/:id', optionalAuth, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);

    try {
        // Story row
        const storyResult = await pool.query(`
            SELECT
                s.id, s.title, s.summary, s.cover_image_url, s.status,
                s.likes_count, s.comment_permission, s.created_at,
                ${TAGS_SUBQ}    AS tags,
                ${AUTHORS_SUBQ} AS authors
            FROM stories s
            WHERE s.id = $1
        `, [storyId]);

        if (storyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Story not found.' });
        }

        const story = storyResult.rows[0];

        // Chapters
        const chapResult = await pool.query(
            `SELECT id, chapter_number, title, content, created_at
             FROM chapters WHERE story_id = $1 ORDER BY chapter_number ASC`,
            [storyId]
        );
        story.chapters = chapResult.rows;

        // Has the requesting user liked this story?
        story.user_liked = false;
        if (req.user) {
            const likeResult = await pool.query(
                'SELECT 1 FROM likes WHERE user_id = $1 AND story_id = $2',
                [req.user.id, storyId]
            );
            story.user_liked = likeResult.rows.length > 0;
        }

        res.json(story);
    } catch (err) {
        console.error('GET /stories/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /stories/:id/comments ─────────────────────────────────────────────────

router.get('/stories/:id/comments', optionalAuth, async (req, res) => {
    const storyId   = parseInt(req.params.id, 10);
    const chapterId = req.query.chapter ? parseInt(req.query.chapter, 10) : null;

    try {
        const params  = [storyId];
        let chapterClause = '';
        if (chapterId) {
            chapterClause = `AND c.chapter_id = $2`;
            params.push(chapterId);
        }

        const { rows } = await pool.query(`
            SELECT
                c.id, c.content, c.created_at, c.parent_id, c.chapter_id,
                u.id AS user_id, u.username, u.avatar_url, u.account_type
            FROM comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.story_id = $1 ${chapterClause}
            ORDER BY c.created_at ASC
        `, params);

        // Reshape so each comment has a nested `user` object
        const comments = rows.map(r => ({
            id:         r.id,
            content:    r.content,
            created_at: r.created_at,
            parent_id:  r.parent_id,
            chapter_id: r.chapter_id,
            user: {
                id:           r.user_id,
                username:     r.username,
                avatar_url:   r.avatar_url,
                account_type: r.account_type,
            },
        }));

        res.json(comments);
    } catch (err) {
        console.error('GET /stories/:id/comments error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /stories/:id/comments ────────────────────────────────────────────────

router.post('/stories/:id/comments', authenticateToken, async (req, res) => {
    const storyId  = parseInt(req.params.id, 10);
    const { chapter_id, content, parent_id } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Comment content is required.' });
    }

    try {
        const { rows } = await pool.query(`
            INSERT INTO comments (story_id, chapter_id, user_id, content, parent_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, content, created_at, parent_id, chapter_id
        `, [storyId, chapter_id || null, req.user.id, content.trim(), parent_id || null]);

        const comment = rows[0];

        // Attach user info for the frontend
        const userResult = await pool.query(
            'SELECT id, username, avatar_url, account_type FROM users WHERE id = $1',
            [req.user.id]
        );
        comment.user = userResult.rows[0];

        res.status(201).json(comment);
    } catch (err) {
        console.error('POST /stories/:id/comments error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── DELETE /comments/:id ──────────────────────────────────────────────────────

router.delete('/comments/:id', authenticateToken, async (req, res) => {
    const commentId = parseInt(req.params.id, 10);

    try {
        const result = await pool.query(
            'SELECT user_id FROM comments WHERE id = $1',
            [commentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found.' });
        }
        if (result.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorised to delete this comment.' });
        }

        // ON DELETE CASCADE in schema handles descendant replies
        await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
        res.status(204).send();
    } catch (err) {
        console.error('DELETE /comments/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /stories/:id/like ────────────────────────────────────────────────────

router.post('/stories/:id/like', authenticateToken, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    const userId  = req.user.id;

    try {
        const existing = await pool.query(
            'SELECT 1 FROM likes WHERE user_id = $1 AND story_id = $2',
            [userId, storyId]
        );

        let liked;
        if (existing.rows.length > 0) {
            await pool.query('DELETE FROM likes WHERE user_id = $1 AND story_id = $2', [userId, storyId]);
            await pool.query('UPDATE stories SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1', [storyId]);
            liked = false;
        } else {
            await pool.query('INSERT INTO likes (user_id, story_id) VALUES ($1, $2)', [userId, storyId]);
            await pool.query('UPDATE stories SET likes_count = likes_count + 1 WHERE id = $1', [storyId]);
            liked = true;
        }

        const { rows } = await pool.query('SELECT likes_count FROM stories WHERE id = $1', [storyId]);
        res.json({ liked, likes_count: rows[0].likes_count });
    } catch (err) {
        console.error('POST /stories/:id/like error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /users/me/reading-lists ───────────────────────────────────────────────

router.get('/users/me/reading-lists', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                rl.id, rl.title, rl.is_public, rl.created_at,
                COALESCE(
                    ARRAY_AGG(rls.story_id) FILTER (WHERE rls.story_id IS NOT NULL),
                    ARRAY[]::INT[]
                ) AS story_ids
            FROM reading_lists rl
            LEFT JOIN reading_list_stories rls ON rls.reading_list_id = rl.id
            WHERE rl.user_id = $1
            GROUP BY rl.id
            ORDER BY rl.created_at ASC
        `, [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error('GET /users/me/reading-lists error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /users/me/reading-lists ──────────────────────────────────────────────

router.post('/users/me/reading-lists', authenticateToken, async (req, res) => {
    const { title, is_public } = req.body;
    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required.' });
    }

    try {
        const { rows } = await pool.query(`
            INSERT INTO reading_lists (user_id, title, is_public)
            VALUES ($1, $2, $3)
            RETURNING id, title, is_public, created_at
        `, [req.user.id, title.trim(), !!is_public]);
        res.status(201).json({ ...rows[0], story_ids: [] });
    } catch (err) {
        console.error('POST /users/me/reading-lists error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /reading-lists/:id/stories ──────────────────────────────────────────

router.post('/reading-lists/:id/stories', authenticateToken, async (req, res) => {
    const listId  = parseInt(req.params.id, 10);
    const { story_id } = req.body;

    if (!story_id) return res.status(400).json({ message: 'story_id is required.' });

    try {
        const ownership = await pool.query(
            'SELECT id FROM reading_lists WHERE id = $1 AND user_id = $2',
            [listId, req.user.id]
        );
        if (ownership.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorised.' });
        }

        await pool.query(
            'INSERT INTO reading_list_stories (reading_list_id, story_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [listId, story_id]
        );
        res.status(204).send();
    } catch (err) {
        console.error('POST /reading-lists/:id/stories error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── DELETE /reading-lists/:id/stories/:storyId ────────────────────────────────

router.delete('/reading-lists/:id/stories/:storyId', authenticateToken, async (req, res) => {
    const listId  = parseInt(req.params.id, 10);
    const storyId = parseInt(req.params.storyId, 10);

    try {
        const ownership = await pool.query(
            'SELECT id FROM reading_lists WHERE id = $1 AND user_id = $2',
            [listId, req.user.id]
        );
        if (ownership.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorised.' });
        }

        await pool.query(
            'DELETE FROM reading_list_stories WHERE reading_list_id = $1 AND story_id = $2',
            [listId, storyId]
        );
        res.status(204).send();
    } catch (err) {
        console.error('DELETE /reading-lists/:id/stories/:storyId error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

module.exports = router;
