const express = require('express');
const Meal = require('../models/meal');
const router = express.Router();
const bodyParser = require('body-parser');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');

var jsonParser = bodyParser.json();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const upload = multer({ dest: 'uploads/' });

router.post('/create', verifyToken, jsonParser, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, restaurantId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Image file is required' });
        }

        const fileStream = fs.createReadStream(file.path);
        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `meals/${Date.now()}-${file.originalname}`,
            Body: fileStream,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        s3.upload(s3Params, async (err, data) => {
            fs.unlink(file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
            });

            if (err) {
                console.error('S3 Upload Error:', err);
                return res.status(500).json({ message: err.message || 'Error uploading to S3' });
            }

            const newMeal = new Meal({
                name,
                description,
                price,
                image: data.Location,
                restaurantId
            });

            await newMeal.save();

            const mealObject = newMeal.toObject();
            delete mealObject._id;
            delete mealObject.__v;

            res.status(201).json(mealObject);
        });
    } catch (error) {
        console.error('Error creating meal:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/by-restaurant/:restaurantId', verifyToken, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const meals = await Meal.find({ restaurantId }).select('-_id -__v');
        res.status(200).json(meals);
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;