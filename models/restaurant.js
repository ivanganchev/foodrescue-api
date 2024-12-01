const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const RestaurantSchema = new mongoose.Schema({
    id: String,
    ownerId: String,
    name: String,
    description: String,
    images: [String]
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);