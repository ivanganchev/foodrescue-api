const express = require('express');
const Restaurant = require('../models/restaurant');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const bodyParser = require('body-parser');
const verifyToken = require('../middleware/authMiddleware');
const ObjectId = require('mongodb').ObjectId;
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const io = require('../app');

var jsonParser = bodyParser.json();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const upload = multer({ dest: 'uploads/' });

router.post('/create', verifyToken, jsonParser, upload.single('image'), async (req, res) => {
    try {
        const { id, ownerId, name, description, latitude, longitude } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Image file is required' });
        }
        
        console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);

        const fileStream = fs.createReadStream(file.path);
        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `restaurants/${Date.now()}-${file.originalname}`,
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

            const newRestaurant = new Restaurant({
                id,
                ownerId,
                name,
                description,
                images: [data.Location],
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            });

            await newRestaurant.save();

            const restaurantObject = newRestaurant.toObject();
            delete restaurantObject._id;
            delete restaurantObject.__v;

            req.io.emit('newRestaurant', restaurantObject);

            res.status(201).json(restaurantObject);
        });
    } catch (error) {
        console.error('Error creating restaurant:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const restaurants = await Restaurant.find().select('-_id').select('-__v');
        res.status(200).json(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/by-owner/:ownerId', verifyToken, async (req, res) => {
    try {
        const { ownerId } = req.params;
        const restaurants = await Restaurant.find({ ownerId }).select('-_id').select('-__v');
        res.status(200).json(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
