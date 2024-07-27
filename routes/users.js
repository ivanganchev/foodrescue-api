const express = require('express');
const User = require('../models/user');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const bodyParser = require('body-parser');
const verifyToken = require('../middleware/authMiddleware');
const ObjectId = require('mongodb').ObjectId;

var jsonParser = bodyParser.json();

router.post('/register', jsonParser, async (req, res) => {
    try {
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(401).json({ token: null, message: 'Username already exists' }); 
        }

        const hashedPassword = await User.hashPassword(req.body.password);
        const user = new User({ userId: req.body.userId,
                                username: req.body.username, 
                                password: hashedPassword, 
                                email: req.body.email});
        await user.save();

        const payload = { id: user.id, username: user.username };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h'});
        res.status(200).json({ token: 'Bearer ' + token, 
                               message: 'Register successful',
                               user: { id: user.userId, username: user.username, email: user.email, role: user.role }
                             });
    } catch (err) {
        res.status(500).json({ token: null, message: 'Register failed' });
    }
});

router.post('/login', jsonParser, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user || !await user.comparePassword(req.body.password)) {
            return res.status(401).json({ token: null, message: 'Invalid credentials' });
        }

        const payload = { id: user.id, username: user.username };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h'});
        res.status(200).json({ 
                                token: 'Bearer ' + token, 
                                message: 'Login successful', 
                                user: { id: user.userId, username: user.username, email: user.email, role: user.role } 
                            });
    } catch (err) {
        res.status(500).json({ token: null, message: 'Login failed' });
    }
});

router.get('/by-id/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(new ObjectId(req.params.id))

        res.status(200).json({
            username: user.username,
            email: user.email
        });
    } catch (err) {
        res.status(500).send("Data fetch failed")
    }
});

router.post('/addRole', verifyToken, jsonParser, async (req, res) => {
    try {
        const { userId, role } = req.body;
        const user = await User.findOne({ userId });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.role = role;
        await user.save();

        res.json({ message: 'Role updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update role' });
    }
});

router.get('/verify-token', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Token is valid' });
});

module.exports = router;
