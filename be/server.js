const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// PostgreSQL connection pool to run DB queries.
const pool = require('./db');

// Create Express application
const app = express();
app.use(express.json());
app.use(cors());

// Routes
const authRoute = require('./routes/auth');
const categoriesRoute = require('./routes/categories');
const storiesRoute = require('./routes/stories');
const notificationsRoute = require('./routes/notifications');
const uploadRoute = require('./routes/upload');
const usersRoute = require('./routes/users');
const reviewRequestsRoute = require('./routes/reviewRequests');
const adminRoute = require('./routes/admin');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/auth', authRoute);
app.use('/', categoriesRoute);
app.use('/', storiesRoute);
app.use('/notifications', notificationsRoute);
app.use('/upload', uploadRoute);
app.use('/users', usersRoute);
app.use('/review-requests', reviewRequestsRoute);
app.use('/admin', adminRoute);

const PORT = process.env.PORT || 5000;

// Ensure the upload directory exists inside the container before the server starts.
const uploadsDir = path.join(__dirname, 'uploads', 'qualifications');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Reads schema.sql and executes it.
const applySchema = async () => {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('Schema applied successfully.');
};

// Deletes notifications older than 14 days.
const DAY_MS = 24 * 60 * 60 * 1000;
const cleanupOldNotifications = async () => {
    try {
        const { rowCount } = await pool.query(
            "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '14 days'"
        );
        if (rowCount > 0) console.log(`Cleaned up ${rowCount} notification(s) older than 14 days.`);
    } catch (err) {
        console.error('Notification cleanup error:', err);
    }
};

// Server only starts listening for requests after the database schema has been successfully applied.
applySchema()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on PORT: ${PORT}`);
        });
        cleanupOldNotifications();
        setInterval(cleanupOldNotifications, DAY_MS);
    })
    .catch((err) => {
        console.error('Failed to apply schema:', err);
        process.exit(1);
    });
