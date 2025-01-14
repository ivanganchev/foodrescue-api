const express = require('express');
const Meal = require('../models/meal');
const router = express.Router();
const bodyParser = require('body-parser');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');
const AWS = require('aws-sdk');
const cron = require('node-cron');
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
        const { id, name, description, price, restaurantId } = req.body;
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
                id,
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

            req.io.emit('newMeal', mealObject);

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

router.delete('/delete/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const meal = await Meal.findOne({ id });

        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        const deletedMeal = meal.toObject();
        await Meal.deleteOne({ id });

        req.io.emit("deleteMeal", deletedMeal);

        res.status(200).json({ message: 'Meal deleted successfully' });
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/reserve', verifyToken, jsonParser, async (req, res) => {
    try {
        const { id, reservationTime, userId } = req.body;

        const meal = await Meal.findOne({ id });

        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        if (meal.reserved) {
            return res.status(400).json({ message: 'Meal is already reserved' });
        }

        const reservationExpiresAt = new Date(Date.now() + reservationTime * 60000); 

        meal.reserved = true;
        meal.reservationExpiresAt = reservationExpiresAt;
        meal.reservedBy = userId;
        await meal.save();

        req.io.emit("reserveMeal", { id, reservationExpiresAt, reservedBy: userId });

        res.status(200).json({reservationExpiresAt});
    } catch (error) {
        console.error('Error reserving meal:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;