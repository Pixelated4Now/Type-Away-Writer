const express = require("express");   
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const pool = require('../db');

require('dotenv').config();

// Configure Gmail transporter.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});



// LOGIN: verifies email and password. Returns a JWT token if both match.
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
 
    try {
        // Check if user exists.
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
 
        const user = result.rows[0];
 
        // Check if passwords match.
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
 
        // Generate JWT token.
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
 
        res.status(200).json({ message: 'Login successful.', token });
 
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});
 
 

// FORGOT PASSWORD: check if email exists. If it does, sends a password reset email.
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
 
    try {
        // Check if user exists.
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            // Return success even if email not found to prevent user enumeration.
            return res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
        }
 
        // Generate a secure reset token.
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
 
        // Save the reset token and expiry to the database.
        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
            [resetToken, resetTokenExpiry, email]
        );
 
        // Build the reset link.
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
 
        // Send the reset email.
        await transporter.sendMail({
            from: `"Type-Away-Writer" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request - Type-Away-Writer',
            text: `Hi,\n\nSomeone has requested a password change for your account ${email} at Type-Away-Writer.\n\nPlease use this link to set a new password: ${resetLink}\n\nCheers,\nYour TAW team.`,
        });
 
        res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
 
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});
 
 
// RESET PASSWORD: verify the reset token and updates the password in the database.
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
 
    try {
        // Find user with matching token that hasn't expired.
        const result = await pool.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
            [token]
        );
 
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }
 
        const user = result.rows[0];
 
        // Hash the new password.
        const hashedPassword = await bcrypt.hash(newPassword, 10);
 
        // Update the password and clear the reset token.
        await pool.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );
 
        res.status(200).json({ message: 'Password reset successful.' });
 
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});


module.exports = router;