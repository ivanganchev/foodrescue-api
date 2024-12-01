const express = require('express');
const usersRouter = require('./users');
const restaurantsRouter = require('./restaurants')
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

router.get("/", verifyToken, (req, res) => {
    res.status(200).json({message: 'Token verified successfully!'});
});

router.use('/users', usersRouter);
router.use('/restaurants', restaurantsRouter);

module.exports = router;
