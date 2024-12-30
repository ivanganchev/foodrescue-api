// filepath: /Users/ivanganchev/Projects/foodrescue-api/app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const allRoutes = require('./routes');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const socketIo = require('socket.io');
const http = require('http');
const jwtSecret = process.env.JWT_SECRET;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret
}

passport.use(new JwtStrategy(options, (jwt_payload, done) => {
    User.findById(jwt_payload.id)
        .then(user => {
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        })
        .catch(err => done(err, false));
}));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/', allRoutes);

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = { app, io };