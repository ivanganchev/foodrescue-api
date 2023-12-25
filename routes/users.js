const express = require('express');
const User = require('../models/user');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const bodyParser = require('body-parser');

var jsonParser = bodyParser.json();

router.post('/register', jsonParser, async (req, res) => {
    try {
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(409).send('Username already exists'); // 409 Conflict
        }

        const hashedPassword = await User.hashPassword(req.body.password);
        const user = new User({ username: req.body.username, password: hashedPassword });
        await user.save();
        res.status(201).send('User created');
    } catch {
        res.status(500).send();
    }
});

router.post('/login',jsonParser, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user || !await user.comparePassword(req.body.password)) {
            return res.status(401).send('Invalid credentials');
        }

        const payload = { id: user.id, username: user.username };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '365d'});
        res.json({ token: 'Bearer ' + token });
    } catch (err) {
        res.status(500).send();
    }
});

module.exports = router;
