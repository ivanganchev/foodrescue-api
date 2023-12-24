require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const allRoutes = require('./routes');

const app = express();
app.use(express.json());
app.use(session({ secret: 'mySecret', resave: false, saveUninitialized: false }));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use('/', allRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});