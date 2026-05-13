const pool = require('../db');

const createNotification = async (userId, type, actorId = null, storyId = null) => {
    await pool.query(
        'INSERT INTO notifications (user_id, type, actor_id, story_id) VALUES ($1, $2, $3, $4)',
        [userId, type, actorId, storyId]
    );
};

module.exports = { createNotification };
