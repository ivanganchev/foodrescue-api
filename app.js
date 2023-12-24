require('dotenv').config();
const express = require('express');
const session = require('express-session');
const allRoutes = require('./routes');

const app = express();
app.use(express.json());
app.use(session({ secret: 'mySecret', resave: false, saveUninitialized: false }));

app.use('/', allRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});