const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto   = require('crypto');
const path     = require('path');
const multer   = require('multer');
const pool     = require('../db');
require('dotenv').config();

// ── Email transporter ────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// ── Multer — qualification file uploads for expert registration ──────────────

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads/qualifications'),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, unique + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: pdf, doc, docx, jpg, jpeg, png.'));
        }
    },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

const buildDOB = (day, month, year) => {
    const monthNum = MONTH_NAMES.indexOf(month) + 1;
    if (!monthNum) return null;
    const m = String(monthNum).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
};

const generateCode = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (user) =>
    jwt.sign(
        { id: user.id, username: user.username, email: user.email, account_type: user.account_type },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

const sendVerificationEmail = async (email, username, code) => {
    await transporter.sendMail({
        from: `"Type-Away-Writer" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Verify your Type-Away-Writer account',
        text:
            `Hi ${username},\n\n` +
            `Welcome to Type-Away-Writer! Your email verification code is:\n\n` +
            `    ${code}\n\n` +
            `This code expires in 24 hours.\n\n` +
            `If you did not create this account, you can safely ignore this email.\n\n` +
            `Cheers,\nThe TAW Team`,
    });
};

// ── Shared registration logic ─────────────────────────────────────────────────

const registerUser = async (res, { username, email, password, birthDay, birthMonth, birthYear, account_type }) => {
    if (!username || !email || !password || !birthDay || !birthMonth || !birthYear) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const existing = await client.query(
            'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            const conflict = existing.rows[0];
            if (conflict.username === username)
                return res.status(409).json({ message: 'Username is already taken.' });
            return res.status(409).json({ message: 'Email address is already registered.' });
        }

        const dob       = buildDOB(birthDay, birthMonth, birthYear);
        const hashedPwd = await bcrypt.hash(password, 10);

        const { rows } = await client.query(
            `INSERT INTO users (username, email, password, account_type, date_of_birth)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, email, account_type`,
            [username, email, hashedPwd, account_type, dob]
        );
        const user = rows[0];

        const code      = generateCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await client.query(
            'INSERT INTO email_verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
            [user.id, code, expiresAt]
        );

        // Send email before committing — rolls back if this throws
        await sendVerificationEmail(email, username, code);

        await client.query('COMMIT');

        return res.status(201).json({
            message: 'Account created. Please check your email for the verification code.',
            userId: user.id,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ── GET /auth/check-username?username= ───────────────────────────────────────

router.get('/check-username', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: 'username is required.' });
    try {
        const { rows } = await pool.query(
            'SELECT 1 FROM users WHERE LOWER(username) = LOWER($1)',
            [username]
        );
        res.json({ available: rows.length === 0 });
    } catch (err) {
        console.error('GET /check-username error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── GET /auth/check-email?email= ─────────────────────────────────────────────

router.get('/check-email', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'email is required.' });
    try {
        const { rows } = await pool.query(
            'SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );
        res.json({ available: rows.length === 0 });
    } catch (err) {
        console.error('GET /check-email error:', err);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// ── POST /auth/register/student ───────────────────────────────────────────────

router.post('/register/student', async (req, res) => {
    const { username, email, password, birthDay, birthMonth, birthYear } = req.body;
    try {
        await registerUser(res, { username, email, password, birthDay, birthMonth, birthYear, account_type: 'student' });
    } catch (err) {
        console.error('Student registration error:', err);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// ── POST /auth/register/expert ────────────────────────────────────────────────

router.post('/register/expert', upload.array('files', 10), async (req, res) => {
    const { username, email, password, birthDay, birthMonth, birthYear } = req.body;
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'At least one qualification file is required.' });
        }
        await registerUser(res, { username, email, password, birthDay, birthMonth, birthYear, account_type: 'expert' });
    } catch (err) {
        console.error('Expert registration error:', err);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// ── POST /auth/verify-email ───────────────────────────────────────────────────

router.post('/verify-email', async (req, res) => {
    const { userId, code } = req.body;
    if (!userId || !code) {
        return res.status(400).json({ message: 'userId and code are required.' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM email_verification_codes
             WHERE user_id = $1 AND code = $2 AND expires_at > NOW()`,
            [userId, code]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification code.' });
        }

        // Mark user as verified and delete the used code
        await pool.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [userId]);
        await pool.query('DELETE FROM email_verification_codes WHERE user_id = $1', [userId]);

        const { rows } = await pool.query(
            'SELECT id, username, email, account_type, avatar_url, is_expert_verified FROM users WHERE id = $1',
            [userId]
        );
        const user  = rows[0];
        const token = signToken(user);

        res.status(200).json({
            message: 'Email verified successfully.',
            token,
            user: { id: user.id, username: user.username, email: user.email, account_type: user.account_type, avatar_url: user.avatar_url || null, is_expert_verified: user.is_expert_verified || false },
        });
    } catch (err) {
        console.error('Email verification error:', err);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// ── POST /auth/resend-verification ───────────────────────────────────────────

router.post('/resend-verification', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    try {
        const { rows } = await pool.query(
            'SELECT id, username, email, is_verified FROM users WHERE id = $1',
            [userId]
        );

        if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
        if (rows[0].is_verified) return res.status(400).json({ message: 'Account is already verified.' });

        const user = rows[0];

        // Replace any existing code
        await pool.query('DELETE FROM email_verification_codes WHERE user_id = $1', [userId]);
        const code      = generateCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await pool.query(
            'INSERT INTO email_verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
            [userId, code, expiresAt]
        );

        await sendVerificationEmail(user.email, user.username, code);
        res.status(200).json({ message: 'Verification email resent.' });
    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = result.rows[0];

        if (!user.is_verified) {
            return res.status(403).json({
                message: 'Please verify your email address before logging in.',
                userId: user.id,
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = signToken(user);

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: user.id, username: user.username, email: user.email, account_type: user.account_type, avatar_url: user.avatar_url || null, is_expert_verified: user.is_expert_verified || false },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// ── POST /auth/forgot-password ────────────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            // Prevent user enumeration — same response either way
            return res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
        }

        const resetToken  = crypto.randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
            [resetToken, resetExpiry, email]
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: `"Type-Away-Writer" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request — Type-Away-Writer',
            text:
                `Hi,\n\n` +
                `Someone requested a password reset for your account (${email}).\n\n` +
                `Reset your password here: ${resetLink}\n\n` +
                `This link expires in 1 hour. If you didn't request this, you can ignore this email.\n\n` +
                `Cheers,\nThe TAW Team`,
        });

        res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// ── POST /auth/reset-password ─────────────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
            [hashedPassword, result.rows[0].id]
        );

        res.status(200).json({ message: 'Password reset successful.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

module.exports = router;
