const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const RestaurantSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    ownerId: String,
    name: String,
    description: String,
    images: [String],
    latitude: Number,
    longitude: Number
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);