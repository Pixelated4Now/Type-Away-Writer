const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
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

// Creates the default admin account on a fresh database so the platform can be tested straight after cloning.
// Defaults match the README's test credentials; override with ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_USERNAME in .env.
// Does nothing if any admin already exists, so an existing admin (or a changed password) is never overwritten.
const seedAdmin = async () => {
    const { rows } = await pool.query("SELECT 1 FROM users WHERE account_type = 'admin' LIMIT 1");
    if (rows.length > 0) return;

    const email    = process.env.ADMIN_EMAIL || 'admin@typeawaywriter.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const username = process.env.ADMIN_USERNAME || 'admin';

    const hashedPwd = await bcrypt.hash(password, 10);
    // Pre-verified so it can log in without email verification.
    const { rowCount } = await pool.query(
        `INSERT INTO users (username, email, password, account_type, is_verified)
         VALUES ($1, $2, $3, 'admin', TRUE)
         ON CONFLICT DO NOTHING`,
        [username, email, hashedPwd]
    );
    if (rowCount > 0) {
        console.log(`Default admin account created (${email}).`);
    } else {
        console.warn(`Default admin not created: username "${username}" or email "${email}" is already taken by another account.`);
    }
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
    .then(seedAdmin)
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
