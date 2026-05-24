const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// Shared SQL fragments.

// Subquery to fetch all tags for a story as an array, ordered alphabetically.
const TAGS_SUBQ = `
    COALESCE(
        (SELECT ARRAY_AGG(t.name ORDER BY t.name)
         FROM story_tags st JOIN tags t ON st.tag_id = t.id
         WHERE st.story_id = s.id),
        ARRAY[]::TEXT[]
    )`;

// Subquery to fetch all authors (original and collaborators) for a story as an array.
const AUTHORS_SUBQ = `
    (SELECT ARRAY_AGG(u2.username ORDER BY u2.username)
     FROM (
         SELECT s2.author_id AS uid FROM stories s2 WHERE s2.id = s.id
         UNION
         SELECT sc.user_id FROM story_collaborators sc WHERE sc.story_id = s.id
     ) combined
     JOIN users u2 ON u2.id = combined.uid)`;

//  Combines both subqueries along with chapter count and comment count. Ensures every story-shaped response has a consistent structure.
const STORY_SELECT = `
    SELECT
        s.id, s.title, s.summary, s.cover_image_url, s.status,
        s.likes_count, s.created_at, s.author_id,
        ${TAGS_SUBQ}    AS tags,
        ${AUTHORS_SUBQ} AS authors,
        (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS chapter_count,
        (SELECT COUNT(*) FROM comments cm WHERE cm.story_id = s.id) AS comment_count
    FROM stories s`;

// GET request to find language expert with matching username.

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

// GET request to retrieve current user profile data.

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, username, email, account_type, avatar_url, bio, header_image_url, date_of_birth, created_at
             FROM users WHERE id = $1`,
            [req.user.id]
        );
        if (!rows[0]) return res.status(404).json({ message: 'User not found.' });
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /users/me error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// PUT request to update username, bio, email, and date of birth.

router.put('/me', authenticateToken, async (req, res) => {
    const { username, bio, email, date_of_birth } = req.body;
    if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Username is required.' });
    }
    const trimmed = username.trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmed)) {
        return res.status(400).json({ message: 'Username must be 3-30 characters (letters, numbers, underscores).' });
    }
    try {
        // Builds the UPDATE query dynamically so that fields not included in the request body are not accidentally overwritten. 
        const setClauses = ['username = $1', 'bio = $2'];
        const params = [trimmed, bio?.trim() || null];
        let idx = 3;

        if (email !== undefined) { setClauses.push(`email = $${idx++}`); params.push(email || null); }
        if (date_of_birth !== undefined) { setClauses.push(`date_of_birth = $${idx++}`); params.push(date_of_birth || null); }

        params.push(req.user.id);
        const { rows } = await pool.query(
            `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx}
             RETURNING id, username, email, account_type, avatar_url, bio, header_image_url, date_of_birth`,
            params
        );
        if (!rows[0]) return res.status(404).json({ message: 'User not found.' });
        res.json(rows[0]);
    } catch (err) {
        // Returns a 409 conflict error if the new username is already taken.
        if (err.code === '23505') return res.status(409).json({ message: 'Username is already taken.' });
        console.error('PUT /users/me error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// PUT request to update avatar URL after user uploads profile photo.

router.put('/me/avatar', authenticateToken, async (req, res) => {
    const { avatar_url } = req.body;
    if (!avatar_url) return res.status(400).json({ message: 'avatar_url is required.' });
    try {
        const { rows } = await pool.query(
            `UPDATE users SET avatar_url = $1 WHERE id = $2
             RETURNING id, username, avatar_url`,
            [avatar_url, req.user.id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /users/me/avatar error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// PUT request to update header image URL after user uploads header image.

router.put('/me/header', authenticateToken, async (req, res) => {
    const { header_image_url } = req.body;
    if (!header_image_url) return res.status(400).json({ message: 'header_image_url is required.' });
    try {
        const { rows } = await pool.query(
            `UPDATE users SET header_image_url = $1 WHERE id = $2
             RETURNING id, username, header_image_url`,
            [header_image_url, req.user.id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /users/me/header error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// DELETE request to remove header image.

router.delete('/me/header', authenticateToken, async (req, res) => {
    try {
        await pool.query(`UPDATE users SET header_image_url = NULL WHERE id = $1`, [req.user.id]);
        res.sendStatus(204);
    } catch (err) {
        console.error('DELETE /users/me/header error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET request to search for students with matching name for collaboration invites.

router.get('/search', authenticateToken, async (req, res) => {
    const { username = '', exclude_story } = req.query;
    try {
        const params = [`%${username.toLowerCase()}%`, req.user.id];
        let excludeClause = '';
        if (exclude_story) {
            params.push(parseInt(exclude_story, 10));
            excludeClause = `
                AND u.id NOT IN (
                    SELECT user_id   FROM story_collaborators WHERE story_id = $3
                    UNION
                    SELECT author_id FROM stories WHERE id = $3
                    UNION
                    SELECT invitee_id FROM collaboration_invitations WHERE story_id = $3 AND status = 'pending'
                )`;
        }
        const { rows } = await pool.query(
            `SELECT id, username, avatar_url
             FROM users u
             WHERE account_type = 'student'
               AND is_active = TRUE
               AND id != $2
               AND LOWER(username) LIKE $1
               ${excludeClause}
             ORDER BY username ASC
             LIMIT 10`,
            params
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /users/search error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET request to retrieve other user's profiles.

router.get('/:username', optionalAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, username, account_type, avatar_url, bio, header_image_url,
                    is_expert_verified, created_at,
                    (SELECT COUNT(*) FROM stories WHERE author_id = u.id AND status = 'published') AS story_count,
                    (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
                    (SELECT COUNT(*) FROM follows WHERE follower_id  = u.id) AS following_count
             FROM users u
             WHERE LOWER(u.username) = LOWER($1)`,
            [req.params.username]
        );
        if (!rows[0]) return res.status(404).json({ message: 'User not found.' });

        const profile = rows[0];
        // Returns whether or not current user is following other user if former is logged in.
        if (req.user) {
            const follow = await pool.query(
                `SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2`,
                [req.user.id, profile.id]
            );
            profile.is_following = follow.rows.length > 0;
        } else {
            profile.is_following = false;
        }
        res.json(profile);
    } catch (err) {
        console.error('GET /users/:username error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET request to retrieve all published stories by user, ordered by most recent first.

router.get('/:username/stories', optionalAuth, async (req, res) => {
    try {
        const user = await pool.query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [req.params.username]);
        if (!user.rows[0]) return res.status(404).json({ message: 'User not found.' });
        const authorId = user.rows[0].id;

        const { rows } = await pool.query(
            `${STORY_SELECT}
             WHERE s.author_id = $1 AND s.status = 'published'
             ORDER BY s.created_at DESC`,
            [authorId]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /users/:username/stories error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET request to retrieve all drafts of stories with no collaborators belonging to user. 

router.get('/:username/drafts', authenticateToken, async (req, res) => {
    try {
        const user = await pool.query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [req.params.username]);
        if (!user.rows[0]) return res.status(404).json({ message: 'User not found.' });
        // Returns 403 if another user is trying to access this.
        if (user.rows[0].id !== req.user.id) return res.status(403).json({ message: 'Forbidden.' });

        const { rows } = await pool.query(
            `${STORY_SELECT}
             WHERE s.author_id = $1
               AND s.status = 'draft'
               AND NOT EXISTS (
                   SELECT 1 FROM story_collaborators sc WHERE sc.story_id = s.id
               )
             ORDER BY s.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /users/:username/drafts error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET request to return all reading lists for a user.

router.get('/:username/reading-lists', optionalAuth, async (req, res) => {
    try {
        const user = await pool.query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [req.params.username]);
        if (!user.rows[0]) return res.status(404).json({ message: 'User not found.' });
        const profileId = user.rows[0].id;

        const isOwn = req.user && req.user.id === profileId;
        const { rows } = await pool.query(
            `SELECT rl.id, rl.title, rl.is_public, rl.created_at,
                    COUNT(rls.story_id) AS story_count,
                    (SELECT s.cover_image_url
                     FROM reading_list_stories rls2
                     JOIN stories s ON s.id = rls2.story_id
                     WHERE rls2.reading_list_id = rl.id
                     ORDER BY rls2.added_at ASC
                     LIMIT 1) AS cover_image_url
             FROM reading_lists rl
             LEFT JOIN reading_list_stories rls ON rls.reading_list_id = rl.id
             WHERE rl.user_id = $1 ${isOwn ? '' : 'AND rl.is_public = TRUE'}
             GROUP BY rl.id
             ORDER BY rl.created_at DESC`,
            [profileId]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /users/:username/reading-lists error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET request to return all stories in a reading list.

router.get('/reading-lists/:id/stories', optionalAuth, async (req, res) => {
    try {
        const list = await pool.query(`SELECT * FROM reading_lists WHERE id = $1`, [req.params.id]);
        if (!list.rows[0]) return res.status(404).json({ message: 'Reading list not found.' });

        const rl = list.rows[0];
        const isOwn = req.user && req.user.id === rl.user_id;
        if (!rl.is_public && !isOwn) return res.status(403).json({ message: 'This list is private.' });

        const { rows } = await pool.query(
            `${STORY_SELECT}
             JOIN reading_list_stories rls ON rls.story_id = s.id
             WHERE rls.reading_list_id = $1
             ORDER BY rls.added_at DESC`,
            [req.params.id]
        );
        res.json({ list: rl, stories: rows });
    } catch (err) {
        console.error('GET /reading-lists/:id/stories error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// PUT request to change reading list title and visibility.

router.put('/reading-lists/:id', authenticateToken, async (req, res) => {
    const { title, is_public } = req.body;
    try {
        const list = await pool.query(`SELECT user_id FROM reading_lists WHERE id = $1`, [req.params.id]);
        if (!list.rows[0]) return res.status(404).json({ message: 'Reading list not found.' });
        if (list.rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden.' });

        const { rows } = await pool.query(
            `UPDATE reading_lists SET title = COALESCE($1, title), is_public = COALESCE($2, is_public)
             WHERE id = $3 RETURNING *`,
            [title || null, is_public !== undefined ? is_public : null, req.params.id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /reading-lists/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// DELETE request to delete reading list.

router.delete('/reading-lists/:id', authenticateToken, async (req, res) => {
    try {
        const list = await pool.query(`SELECT user_id FROM reading_lists WHERE id = $1`, [req.params.id]);
        if (!list.rows[0]) return res.status(404).json({ message: 'Reading list not found.' });
        // Verify ownership
        if (list.rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden.' });

        await pool.query(`DELETE FROM reading_lists WHERE id = $1`, [req.params.id]);
        res.sendStatus(204);
    } catch (err) {
        console.error('DELETE /reading-lists/:id error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// DELLETE request to remove a story from a list.

router.delete('/reading-lists/:id/stories/:storyId', authenticateToken, async (req, res) => {
    try {
        const list = await pool.query(`SELECT user_id FROM reading_lists WHERE id = $1`, [req.params.id]);
        if (!list.rows[0]) return res.status(404).json({ message: 'Reading list not found.' });
        if (list.rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden.' });

        await pool.query(
            `DELETE FROM reading_list_stories WHERE reading_list_id = $1 AND story_id = $2`,
            [req.params.id, req.params.storyId]
        );
        res.sendStatus(204);
    } catch (err) {
        console.error('DELETE /reading-lists/:id/stories/:storyId error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET request to retrieve the list of following users, ordered by most recently followed first.

router.get('/:username/following', optionalAuth, async (req, res) => {
    try {
        const user = await pool.query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [req.params.username]);
        if (!user.rows[0]) return res.status(404).json({ message: 'User not found.' });

        const { rows } = await pool.query(
            `SELECT u.id, u.username, u.avatar_url, u.account_type, u.is_expert_verified
             FROM follows f
             JOIN users u ON u.id = f.following_id
             WHERE f.follower_id = $1
             ORDER BY f.created_at DESC`,
            [user.rows[0].id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /users/:username/following error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET request to retrieve followers.

router.get('/:username/followers', optionalAuth, async (req, res) => {
    try {
        const user = await pool.query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [req.params.username]);
        if (!user.rows[0]) return res.status(404).json({ message: 'User not found.' });

        const { rows } = await pool.query(
            `SELECT u.id, u.username, u.avatar_url, u.account_type, u.is_expert_verified
             FROM follows f
             JOIN users u ON u.id = f.follower_id
             WHERE f.following_id = $1
             ORDER BY f.created_at DESC`,
            [user.rows[0].id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /users/:username/followers error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// POST request to follow a user.

router.post('/:username/follow', authenticateToken, async (req, res) => {
    // Block expert attempts to follow.
    if (req.user.account_type !== 'student') {
        return res.status(403).json({ message: 'Only students can follow users.' });
    }
    try {
        const target = await pool.query(
            `SELECT id FROM users WHERE LOWER(username) = LOWER($1)`,
            [req.params.username]
        );
        if (!target.rows[0]) return res.status(404).json({ message: 'User not found.' });
        const targetId = target.rows[0].id;
        if (targetId === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself.' });

        await pool.query(
            `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [req.user.id, targetId]
        );
        // Sends a follow notification to the followed user.
        await createNotification(targetId, 'follow', req.user.id, null);
        res.sendStatus(204);
    } catch (err) {
        console.error('POST /users/:username/follow error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// DELETE request to unfollow a user.

router.delete('/:username/follow', authenticateToken, async (req, res) => {
    try {
        const target = await pool.query(
            `SELECT id FROM users WHERE LOWER(username) = LOWER($1)`,
            [req.params.username]
        );
        if (!target.rows[0]) return res.status(404).json({ message: 'User not found.' });

        await pool.query(
            `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
            [req.user.id, target.rows[0].id]
        );
        res.sendStatus(204);
    } catch (err) {
        console.error('DELETE /users/:username/follow error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// DELETE request to remove a follower from your followers list.

router.delete('/:username/followers/:followerId', authenticateToken, async (req, res) => {
    try {
        const target = await pool.query(
            `SELECT id FROM users WHERE LOWER(username) = LOWER($1)`,
            [req.params.username]
        );
        if (!target.rows[0]) return res.status(404).json({ message: 'User not found.' });
        // Only allowed for profile owner.
        if (target.rows[0].id !== req.user.id) return res.status(403).json({ message: 'Forbidden.' });

        await pool.query(
            `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
            [req.params.followerId, req.user.id]
        );
        res.sendStatus(204);
    } catch (err) {
        console.error('DELETE /users/:username/followers/:followerId error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// GET request to return all unpublished collaboration stories for the logged-in user.

router.get('/:username/collaborations', authenticateToken, async (req, res) => {
    try {
        const user = await pool.query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [req.params.username]);
        if (!user.rows[0]) return res.status(404).json({ message: 'User not found.' });
        // Only accessible by the profile owner.
        if (user.rows[0].id !== req.user.id) return res.status(403).json({ message: 'Forbidden.' });

        // Stories where user is a collaborator, and where user is original author, but has collaborators working on story.
        const { rows } = await pool.query(
            `${STORY_SELECT}
             WHERE (
                 EXISTS (
                     SELECT 1 FROM story_collaborators sc
                     WHERE sc.story_id = s.id AND sc.user_id = $1
                 )
                 OR (
                     s.author_id = $1
                     AND s.status != 'published'
                     AND EXISTS (
                         SELECT 1 FROM story_collaborators sc2 WHERE sc2.story_id = s.id
                     )
                 )
             )
             ORDER BY s.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /users/:username/collaborations error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

module.exports = router;
