const express = require('express');
const usersRouter = require('./users');
const restaurantsRouter = require('./restaurants')
const mealsRouter = require('./meals');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

router.get("/", verifyToken, (req, res) => {
    res.status(200).json({message: 'Token verified successfully!'});
});

router.use('/users', usersRouter);
router.use('/restaurants', restaurantsRouter);
router.use('/meals', mealsRouter);

module.exports = router;
