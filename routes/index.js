const express = require('express');
const usersRouter = require('./users');
const router = express.Router();

router.get("/", (req, res) => {
    console.log("afdsfdsfsf");
});

router.use('/users', usersRouter);

module.exports = router;
