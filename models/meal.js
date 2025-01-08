const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MealSchema = new mongoose.Schema({
    id: String,
    name: String,
    description: String,
    price: String,
    image: String,
    restaurantId: String,
    reserved: Boolean, 
    reservationExpiresAt: Date,
    reservedBy: String
});

module.exports = mongoose.model('Meal', MealSchema);