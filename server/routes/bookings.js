import express from 'express';
import Booking from '../models/Booking.js';

const router = express.Router();

// Helper function for generating IDs
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET bookings by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const bookings = await Booking.find({ studentId: req.params.studentId });
    res.json(bookings);
  } catch (error) {
    console.error('Error getting student bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET bookings by tutor
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const bookings = await Booking.find({ tutorId: req.params.tutorId });
    res.json(bookings);
  } catch (error) {
    console.error('Error getting tutor bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new booking
router.post('/', async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      bookingId: req.body.bookingId || cryptoRandomId(),
      status: req.body.status || 'pending',
      createdAt: req.body.createdAt || new Date()
    };

    const newBooking = new Booking(bookingData);
    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update booking
router.put('/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      req.body,
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE booking
router.delete('/:bookingId', async (req, res) => {
  try {
    await Booking.findOneAndDelete({ bookingId: req.params.bookingId });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;