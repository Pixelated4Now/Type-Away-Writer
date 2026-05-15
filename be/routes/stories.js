const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

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
        // Story row — tags returned as [{id,name}] objects for editor/settings use
        const storyResult = await pool.query(`
            SELECT
                s.id, s.title, s.summary, s.cover_image_url, s.status,
                s.work_status, s.author_id, s.category_id,
                s.likes_count, s.comment_permission, s.created_at,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', t.id, 'name', t.name) ORDER BY t.name)
                     FROM story_tags st JOIN tags t ON st.tag_id = t.id
                     WHERE st.story_id = s.id),
                    '[]'::JSON
                )               AS tags,
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
        const storyRes = await pool.query('SELECT author_id FROM stories WHERE id = $1', [storyId]);
        if (storyRes.rows.length === 0) return res.status(404).json({ message: 'Story not found.' });
        const storyAuthorId = storyRes.rows[0].author_id;

        let parentAuthorId = null;
        if (parent_id) {
            const parentRes = await pool.query('SELECT user_id FROM comments WHERE id = $1', [parent_id]);
            if (parentRes.rows.length > 0) parentAuthorId = parentRes.rows[0].user_id;
        }

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

        // ── Notifications (fire-and-forget after response) ─────────────────────
        if (parent_id) {
            if (parentAuthorId && parentAuthorId !== req.user.id) {
                createNotification(parentAuthorId, 'reply', req.user.id, storyId).catch(console.error);
            }
        } else if (storyAuthorId !== req.user.id) {
            const type = comment.user.account_type === 'expert' ? 'review' : 'comment';
            createNotification(storyAuthorId, type, req.user.id, storyId).catch(console.error);
        }
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

        const { rows } = await pool.query('SELECT likes_count, author_id FROM stories WHERE id = $1', [storyId]);
        res.json({ liked, likes_count: rows[0].likes_count });
        if (liked && rows[0].author_id !== userId) {
            createNotification(rows[0].author_id, 'like', userId, storyId).catch(console.error);
        }
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

        const insertRes = await pool.query(
            'INSERT INTO reading_list_stories (reading_list_id, story_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [listId, story_id]
        );

        let saveAuthorId = null;
        if (insertRes.rowCount > 0) {
            const storyRes = await pool.query('SELECT author_id FROM stories WHERE id = $1', [story_id]);
            if (storyRes.rows.length > 0) saveAuthorId = storyRes.rows[0].author_id;
        }

        res.status(204).send();

        if (saveAuthorId && saveAuthorId !== req.user.id) {
            createNotification(saveAuthorId, 'save', req.user.id, story_id).catch(console.error);
        }
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

// ── POST /stories ─────────────────────────────────────────────────────────────

router.post('/stories', authenticateToken, async (req, res) => {
    const { title, summary, work_status, category_id, tag_ids, cover_image_url } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Title is required.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `INSERT INTO stories (title, summary, work_status, category_id, cover_image_url, author_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'writing')
             RETURNING id`,
            [title.trim(), summary || '', work_status || 'ongoing', category_id || null, cover_image_url || null, req.user.id]
        );
        const storyId = rows[0].id;
        if (Array.isArray(tag_ids) && tag_ids.length > 0) {
            for (const tid of tag_ids) {
                await client.query(
                    'INSERT INTO story_tags (story_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [storyId, tid]
                );
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ id: storyId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /stories error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    } finally {
        client.release();
    }
});

// ── PUT /stories/:id ──────────────────────────────────────────────────────────

router.put('/stories/:id', authenticateToken, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    const { title, summary, work_status, category_id, tag_ids, cover_image_url, status } = req.body;

    const client = await pool.connect();
    try {
        const check = await client.query('SELECT author_id FROM stories WHERE id = $1', [storyId]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Story not found.' });
        if (check.rows[0].author_id !== req.user.id) return res.status(403).json({ message: 'Not authorised.' });

        await client.query('BEGIN');
        await client.query(
            `UPDATE stories SET
                title           = COALESCE($1, title),
                summary         = COALESCE($2, summary),
                work_status     = COALESCE($3, work_status),
                category_id     = COALESCE($4, category_id),
                cover_image_url = COALESCE($5, cover_image_url),
                status          = COALESCE($6, status),
                updated_at      = NOW()
             WHERE id = $7`,
            [
                title ? title.trim() : null,
                summary !== undefined ? summary : null,
                work_status || null,
                category_id || null,
                cover_image_url || null,
                status || null,
                storyId,
            ]
        );

        if (Array.isArray(tag_ids)) {
            await client.query('DELETE FROM story_tags WHERE story_id = $1', [storyId]);
            for (const tid of tag_ids) {
                await client.query(
                    'INSERT INTO story_tags (story_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [storyId, tid]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ id: storyId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /stories/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    } finally {
        client.release();
    }
});

// ── DELETE /stories/:id ───────────────────────────────────────────────────────

router.delete('/stories/:id', authenticateToken, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    try {
        const check = await pool.query('SELECT author_id FROM stories WHERE id = $1', [storyId]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Story not found.' });
        if (check.rows[0].author_id !== req.user.id) return res.status(403).json({ message: 'Not authorised.' });

        await pool.query('DELETE FROM stories WHERE id = $1', [storyId]);
        res.sendStatus(204);
    } catch (err) {
        console.error('DELETE /stories/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /stories/:id/publish ─────────────────────────────────────────────────

router.post('/stories/:id/publish', authenticateToken, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    try {
        const storyRes = await pool.query(
            `SELECT s.title, s.summary, s.cover_image_url, s.work_status, s.category_id, s.author_id,
                    (SELECT COUNT(*) FROM story_tags WHERE story_id = s.id) AS tag_count
             FROM stories s WHERE s.id = $1`,
            [storyId]
        );
        if (storyRes.rows.length === 0) return res.status(404).json({ message: 'Story not found.' });
        const s = storyRes.rows[0];
        if (s.author_id !== req.user.id) return res.status(403).json({ message: 'Not authorised.' });

        const chapRes = await pool.query(
            'SELECT title, content FROM chapters WHERE story_id = $1 ORDER BY chapter_number',
            [storyId]
        );

        const errors = [];
        if (!s.cover_image_url)          errors.push('Cover image is required.');
        if (!s.title || !s.title.trim()) errors.push('Story title is required.');
        if (!s.summary || !s.summary.trim()) errors.push('Summary is required.');
        if (!s.work_status)              errors.push('Work status is required.');
        if (!s.category_id)              errors.push('Category is required.');
        if (parseInt(s.tag_count, 10) === 0) errors.push('At least one tag is required.');
        if (chapRes.rows.length === 0)   errors.push('Story must have at least one chapter.');
        chapRes.rows.forEach((ch, i) => {
            if (!ch.title || !ch.title.trim()) errors.push(`Chapter ${i + 1} needs a name.`);
            const text = (ch.content || '').replace(/<[^>]*>/g, '').trim();
            if (!text) errors.push(`Chapter ${i + 1} has no content.`);
        });

        if (errors.length > 0) return res.status(422).json({ errors });

        await pool.query("UPDATE stories SET status = 'published', updated_at = NOW() WHERE id = $1", [storyId]);
        res.json({ success: true });
    } catch (err) {
        console.error('POST /stories/:id/publish error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /stories/:id/chapters ─────────────────────────────────────────────────

router.get('/stories/:id/chapters', authenticateToken, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    try {
        const { rows } = await pool.query(
            'SELECT id, chapter_number, title, content FROM chapters WHERE story_id = $1 ORDER BY chapter_number ASC',
            [storyId]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /stories/:id/chapters error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /stories/:id/chapters ────────────────────────────────────────────────

router.post('/stories/:id/chapters', authenticateToken, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    try {
        const check = await pool.query('SELECT author_id FROM stories WHERE id = $1', [storyId]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Story not found.' });
        if (check.rows[0].author_id !== req.user.id) return res.status(403).json({ message: 'Not authorised.' });

        const { rows: maxRows } = await pool.query(
            'SELECT COALESCE(MAX(chapter_number), 0) AS max FROM chapters WHERE story_id = $1',
            [storyId]
        );
        const nextNum = parseInt(maxRows[0].max, 10) + 1;

        const { rows } = await pool.query(
            `INSERT INTO chapters (story_id, chapter_number, title, content)
             VALUES ($1, $2, $3, $4) RETURNING id, chapter_number, title, content`,
            [storyId, nextNum, '', '']
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /stories/:id/chapters error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── PUT /chapters/:chapterId ──────────────────────────────────────────────────

router.put('/chapters/:chapterId', authenticateToken, async (req, res) => {
    const chapterId = parseInt(req.params.chapterId, 10);
    const { title, content } = req.body;
    try {
        const chapRes = await pool.query(
            'SELECT c.id, s.author_id FROM chapters c JOIN stories s ON s.id = c.story_id WHERE c.id = $1',
            [chapterId]
        );
        if (chapRes.rows.length === 0) return res.status(404).json({ message: 'Chapter not found.' });
        if (chapRes.rows[0].author_id !== req.user.id) return res.status(403).json({ message: 'Not authorised.' });

        await pool.query(
            'UPDATE chapters SET title = $1, content = $2 WHERE id = $3',
            [title || '', content || '', chapterId]
        );
        res.json({ id: chapterId });
    } catch (err) {
        console.error('PUT /chapters/:chapterId error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── DELETE /chapters/:chapterId ───────────────────────────────────────────────

router.delete('/chapters/:chapterId', authenticateToken, async (req, res) => {
    const chapterId = parseInt(req.params.chapterId, 10);
    try {
        const chapRes = await pool.query(
            'SELECT c.story_id, s.author_id FROM chapters c JOIN stories s ON s.id = c.story_id WHERE c.id = $1',
            [chapterId]
        );
        if (chapRes.rows.length === 0) return res.status(404).json({ message: 'Chapter not found.' });
        if (chapRes.rows[0].author_id !== req.user.id) return res.status(403).json({ message: 'Not authorised.' });

        const { story_id } = chapRes.rows[0];
        const { rows: countRows } = await pool.query(
            'SELECT COUNT(*) AS cnt FROM chapters WHERE story_id = $1',
            [story_id]
        );
        if (parseInt(countRows[0].cnt, 10) <= 1) {
            return res.status(400).json({ message: 'Cannot delete the only chapter.' });
        }

        await pool.query('DELETE FROM chapters WHERE id = $1', [chapterId]);
        res.status(204).send();
    } catch (err) {
        console.error('DELETE /chapters/:chapterId error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /stories/:id/review-requests ────────────────────────────────────────

router.post('/stories/:id/review-requests', authenticateToken, async (req, res) => {
    const storyId  = parseInt(req.params.id, 10);
    const { expert_id } = req.body;
    if (!expert_id) return res.status(400).json({ message: 'expert_id is required.' });

    try {
        const expertRes = await pool.query(
            "SELECT id FROM users WHERE id = $1 AND account_type = 'expert' AND is_expert_verified = TRUE",
            [expert_id]
        );
        if (expertRes.rows.length === 0) return res.status(400).json({ message: 'Invalid expert.' });

        await pool.query(
            'INSERT INTO review_requests (story_id, student_id, expert_id) VALUES ($1, $2, $3)',
            [storyId, req.user.id, expert_id]
        );

        await pool.query(
            `INSERT INTO notifications (user_id, type, actor_id, story_id)
             VALUES ($1, 'review_request', $2, $3)`,
            [expert_id, req.user.id, storyId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('POST /stories/:id/review-requests error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /stories/:id/invitations ─────────────────────────────────────────────

router.post('/stories/:id/invitations', authenticateToken, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    const { invitee_id } = req.body;
    if (!invitee_id) return res.status(400).json({ message: 'invitee_id is required.' });

    try {
        const storyRes = await pool.query('SELECT author_id FROM stories WHERE id = $1', [storyId]);
        if (storyRes.rows.length === 0) return res.status(404).json({ message: 'Story not found.' });
        if (storyRes.rows[0].author_id !== req.user.id) return res.status(403).json({ message: 'Not authorised.' });

        const existingCollab = await pool.query(
            'SELECT 1 FROM story_collaborators WHERE story_id = $1 AND user_id = $2',
            [storyId, invitee_id]
        );
        if (existingCollab.rows.length > 0) return res.status(409).json({ message: 'Already a collaborator.' });

        const existingInv = await pool.query(
            "SELECT 1 FROM collaboration_invitations WHERE story_id = $1 AND invitee_id = $2 AND status = 'pending'",
            [storyId, invitee_id]
        );
        if (existingInv.rows.length > 0) return res.status(409).json({ message: 'Invitation already sent.' });

        const { rows } = await pool.query(
            'INSERT INTO collaboration_invitations (story_id, inviter_id, invitee_id) VALUES ($1, $2, $3) RETURNING id',
            [storyId, req.user.id, invitee_id]
        );
        const invId = rows[0].id;

        await pool.query(
            'INSERT INTO notifications (user_id, type, actor_id, story_id, invitation_id) VALUES ($1, $2, $3, $4, $5)',
            [invitee_id, 'collab_invite', req.user.id, storyId, invId]
        );

        res.status(201).json({ id: invId });
    } catch (err) {
        console.error('POST /stories/:id/invitations error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /stories/:id/invitations/:invId/accept ───────────────────────────────

router.post('/stories/:id/invitations/:invId/accept', authenticateToken, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    const invId   = parseInt(req.params.invId, 10);

    try {
        const inv = await pool.query(
            "SELECT * FROM collaboration_invitations WHERE id = $1 AND story_id = $2 AND status = 'pending'",
            [invId, storyId]
        );
        if (inv.rows.length === 0) return res.status(404).json({ message: 'Invitation not found.' });
        if (inv.rows[0].invitee_id !== req.user.id) return res.status(403).json({ message: 'Not authorised.' });

        const invitation = inv.rows[0];

        await pool.query("UPDATE collaboration_invitations SET status = 'accepted' WHERE id = $1", [invId]);
        await pool.query(
            'INSERT INTO story_collaborators (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [storyId, req.user.id]
        );
        await pool.query(
            'INSERT INTO notifications (user_id, type, actor_id, story_id) VALUES ($1, $2, $3, $4)',
            [invitation.inviter_id, 'collab_accepted', req.user.id, storyId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('POST /stories/:id/invitations/:invId/accept error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /stories/:id/invitations/:invId/decline ──────────────────────────────

router.post('/stories/:id/invitations/:invId/decline', authenticateToken, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    const invId   = parseInt(req.params.invId, 10);

    try {
        const inv = await pool.query(
            "SELECT * FROM collaboration_invitations WHERE id = $1 AND story_id = $2 AND status = 'pending'",
            [invId, storyId]
        );
        if (inv.rows.length === 0) return res.status(404).json({ message: 'Invitation not found.' });
        if (inv.rows[0].invitee_id !== req.user.id) return res.status(403).json({ message: 'Not authorised.' });

        const invitation = inv.rows[0];

        await pool.query("UPDATE collaboration_invitations SET status = 'declined' WHERE id = $1", [invId]);
        await pool.query(
            'INSERT INTO notifications (user_id, type, actor_id, story_id) VALUES ($1, $2, $3, $4)',
            [invitation.inviter_id, 'collab_declined', req.user.id, storyId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('POST /stories/:id/invitations/:invId/decline error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

module.exports = router;
