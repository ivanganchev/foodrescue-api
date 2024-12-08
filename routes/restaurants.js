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

var jsonParser = bodyParser.json();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const upload = multer({ dest: 'uploads/' });

router.post('/create', verifyToken, jsonParser, upload.single('image'), async (req, res) => {
    try {
        const { ownerId, name, description } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Image file is required' });
        }

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
                ownerId,
                name,
                description,
                images: [data.Location]
            });

            await newRestaurant.save();

            res.status(201).json({
                message: 'Restaurant created successfully',
                restaurant: newRestaurant
            });
        });
    } catch (error) {
        console.error('Error creating restaurant:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
