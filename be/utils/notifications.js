const pool = require('../db');

const createNotification = async (userId, type, actorId = null, storyId = null) => {
    await pool.query(
        'INSERT INTO notifications (user_id, type, actor_id, story_id) VALUES ($1, $2, $3, $4)',
        [userId, type, actorId, storyId]
    );
};

// Notifies the original author and all collaborators of a story, skipping the user who triggered it.
const notifyStoryAuthors = async (storyId, type, actorId) => {
    await pool.query(
        `INSERT INTO notifications (user_id, type, actor_id, story_id)
         SELECT uid, $2::varchar, $3::int, $1::int
         FROM (
             SELECT author_id AS uid FROM stories WHERE id = $1
             UNION
             SELECT user_id FROM story_collaborators WHERE story_id = $1
         ) authors
         WHERE uid <> $3`,
        [storyId, type, actorId]
    );
};

module.exports = { createNotification, notifyStoryAuthors };
