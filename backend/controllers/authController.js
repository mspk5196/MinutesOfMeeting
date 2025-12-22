// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authController = {
    login: async(req, res) => {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide both email and password'
                });
            }

            // Find user
            const [users] = await db.query(
                'SELECT * FROM users WHERE email = ?', [email]
            );

            if (users.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const user = users[0];
            console.log('User found:', !!user);

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid credentials'
                });
                console.log('Password match:', isMatch);
            }



            // Generate token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role || 'participant'
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during login'
            });
        }
    },

    register: async(req, res) => {
        try {
            const { name, email, password, role } = req.body;

            // Validation
            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide all required fields'
                });
            }

            // Check existing user
            const [existingUsers] = await db.query(
                'SELECT * FROM users WHERE email = ?', [email]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Determine role - default to 'participant'
            const userRole = role && typeof role === 'string' ? role.toLowerCase() : 'participant';

            // Create user
            const [result] = await db.query(
                'INSERT INTO users (name, email, password, auth_type, role) VALUES (?, ?, ?, "local", ?)', [name, email, hashedPassword, userRole]
            );

            // Generate token
            const token = jwt.sign(
                { id: result.insertId, email },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

            res.status(201).json({
                success: true,
                token,
                user: {
                    id: result.insertId,
                    name,
                    email,
                    role: userRole
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during registration'
            });
        }
    },

    getMe: async(req, res) => {
        try {
            // Fetch user details (excluding sensitive information)
            const [users] = await db.query(
                'SELECT id, name, email, auth_type, role FROM users WHERE id = ?', [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user: users[0]
            });
        } catch (error) {
            console.error('Get me error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error retrieving user data'
            });
        }
    }
};

module.exports = authController;