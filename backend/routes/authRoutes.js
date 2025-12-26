// routes/authRoutes.js
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const db = require('../config/db');

const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.API_URL}/auth/google/callback`
);

// Local auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Google OAuth routes - Step 1: Redirect to Google
router.get('/google', (req, res) => {
    const authUrl = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        prompt: 'consent'
    });
    res.redirect(authUrl);
});

// Google OAuth routes - Step 2: Handle callback
router.get('/google/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=no_code`);
    }

    try {
        // Exchange code for tokens
        const { tokens } = await googleClient.getToken(code);
        googleClient.setCredentials(tokens);

        // Get user info from Google
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists in database
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE email = ? OR google_id = ?',
            [email, googleId]
        );

        let userId;
        let user;

        if (existingUsers.length > 0) {
            // Update existing user with Google ID (but don't overwrite auth_type if they already have local auth)
            user = existingUsers[0];
            userId = user.id;
            await db.query(
                'UPDATE users SET google_id = ?, name = ? WHERE id = ?',
                [googleId, name, userId]
            );
        } else {
            // Create new user
            const [result] = await db.query(
                'INSERT INTO users (name, email, google_id, auth_type) VALUES (?, ?, ?, ?)',
                [name, email, googleId, 'google']
            );
            userId = result.insertId;
            user = { id: userId, name, email, google_id: googleId, auth_type: 'google' };
        }

        // Generate JWT token
        const jwtToken = jwt.sign(
            { userId: userId, email, name },
            process.env.JWT_SECRET || 'your-jwt-secret',
            { expiresIn: '24h' }
        );

        // Prepare user data to send to frontend
        const userData = {
            id: userId,
            name: name,
            email: email
        };

        // Redirect to frontend with token and user data
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }
});

// Verify Google token from frontend (alternative method)
router.post('/google/verify', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ success: false, message: 'No credential provided' });
    }

    try {
        // Verify the token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        // Check if user exists
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE email = ? OR google_id = ?',
            [email, googleId]
        );

        let userId;
        let user;

        if (existingUsers.length > 0) {
            user = existingUsers[0];
            userId = user.id;
            await db.query(
                'UPDATE users SET google_id = ?, name = ?, auth_type = ? WHERE id = ?',
                [googleId, name, 'google', userId]
            );
        } else {
            const [result] = await db.query(
                'INSERT INTO users (name, email, google_id, auth_type) VALUES (?, ?, ?, ?)',
                [name, email, googleId, 'google']
            );
            userId = result.insertId;
            user = { id: userId, name, email, google_id: googleId, auth_type: 'google' };
        }

        // Generate JWT
        const token = jwt.sign(
            { id: userId, email, name },
            process.env.JWT_SECRET || 'your-jwt-secret',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { id: userId, name, email }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// Protected routes
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;