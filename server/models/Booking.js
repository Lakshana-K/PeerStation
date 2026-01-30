import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  tutorId: { type: String, required: true },
  subject: String,
  specificTopic: String,
  scheduledDate: String,
  scheduledTime: String,
  scheduledDateTime: String,
  duration: Number,
  format: String,
  location: String,
  status: { type: String, default: 'pending' },
  additionalNotes: String,
  createdAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  completedAt: Date,
  cancelledAt: Date
}, { strict: false });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;