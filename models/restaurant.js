const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    id: String,
    ownerId: String,
    name: String,
    description: String,
    images: [String],
    latitude: Number,
    longitude: Number
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);