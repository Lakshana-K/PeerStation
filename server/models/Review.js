import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewId: { type: String, required: true, unique: true },
  bookingId: String,
  studentId: { type: String, required: true },
  tutorId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const Review = mongoose.model('Review', reviewSchema);

export default Review;