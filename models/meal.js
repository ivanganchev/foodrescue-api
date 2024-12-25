const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MealSchema = new mongoose.Schema({
    id: String,
    name: String,
    description: String,
    price: String,
    image: String,
    restaurantId: String
});

module.exports = mongoose.model('Meal', MealSchema);