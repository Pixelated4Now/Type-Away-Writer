const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
require('dotenv').config();

const pool = require('./db');

const app = express();
app.use(express.json());
app.use(cors());

// Routes
const authRoute          = require('./routes/auth');
const categoriesRoute    = require('./routes/categories');
const storiesRoute       = require('./routes/stories');
const notificationsRoute = require('./routes/notifications');
const uploadRoute        = require('./routes/upload');
const usersRoute         = require('./routes/users');

app.use('/uploads',       express.static(path.join(__dirname, 'uploads')));
app.use('/auth',          authRoute);
app.use('/',              categoriesRoute);
app.use('/',              storiesRoute);
app.use('/notifications', notificationsRoute);
app.use('/upload',        uploadRoute);
app.use('/users',         usersRoute);

const PORT = process.env.PORT || 5000;

// Ensure the qualifications upload directory exists inside the container.
const uploadsDir = path.join(__dirname, 'uploads', 'qualifications');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Apply the full schema (CREATE TABLE IF NOT EXISTS + seeds) then start.
const applySchema = async () => {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('Schema applied successfully.');
};

applySchema()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on PORT: ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to apply schema:', err);
        process.exit(1);
    });
