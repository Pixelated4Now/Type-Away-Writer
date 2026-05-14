const jwt = require('jsonwebtoken');
require('dotenv').config();

// Blocks the request if no valid token is present.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

// Attaches user info if a valid token is present, but never blocks the request.
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch { /* ignore */ }
    }
    next();
};

// Blocks the request if the user's account_type is not in the allowed list.
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.account_type)) {
        return res.status(403).json({ message: 'Forbidden.' });
    }
    next();
};

module.exports = { authenticateToken, optionalAuth, requireRole };
