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
            return res.json({ token: null, message: 'Username already exists' }); 
        }

        const payload = { id: user.id, username: user.username };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '365d'});
        const hashedPassword = await User.hashPassword(req.body.password);
        const user = new User({ username: req.body.username, 
                                password: hashedPassword, 
                                email: req.body.email});
        await user.save();
        res.json({ token: 'Bearer ' + token, message: 'Register successful' });
    } catch {
        res.json({ token: null, message: 'Register failed' });
    }
});

router.post('/login', jsonParser, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user || !await user.comparePassword(req.body.password)) {
            return res.status(401).json({ token: null, message: 'Invalid credentials' });
        }

        const payload = { id: user.id, username: user.username };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '365d'});
        res.json({ token: 'Bearer ' + token, message: 'Login successful' });
    } catch (err) {
        res.json({ token: null, message: 'Login failed' });
    }
});

router.get('/by-id/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(new ObjectId(req.params.id))

        res.status(200).json({
            username: user.username,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        res.status(500).send("Data fetch failed")
    }
});

module.exports = router;
