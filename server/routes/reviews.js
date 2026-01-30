import express from 'express';
import Review from '../models/Review.js';

const router = express.Router();

// Helper function for generating IDs
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// GET all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET reviews by tutor
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.params.tutorId });
    res.json(reviews);
  } catch (error) {
    console.error('Error getting tutor reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new review
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating review with data:', req.body);
    
    const reviewData = {
      ...req.body,
      reviewId: req.body.reviewId || cryptoRandomId(),
      createdAt: req.body.createdAt || new Date()
    };

    const newReview = new Review(reviewData);
    await newReview.save();
    
    console.log('✅ Review created:', newReview);
    res.status(201).json(newReview);
  } catch (error) {
    console.error('❌ Error creating review:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;