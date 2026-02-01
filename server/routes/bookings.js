import express from 'express';
import Booking from '../models/Booking.js';

const router = express.Router();

// Helper function for generating IDs
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: List of all bookings
 *       404:
 *         description: No bookings found
 */
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings); // Returns array directly
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/bookings/student/{studentId}:
 *   get:
 *     summary: Get bookings by student
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/student/:studentId', async (req, res) => {
  try {
    if (!req.params.studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const bookings = await Booking.find({ studentId: req.params.studentId });
    res.json(bookings); // Returns array directly
  } catch (error) {
    console.error('Error getting student bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/bookings/tutor/{tutorId}:
 *   get:
 *     summary: Get bookings by tutor
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    if (!req.params.tutorId) {
      return res.status(400).json({ message: 'Tutor ID is required' });
    }

    const bookings = await Booking.find({ tutorId: req.params.tutorId });
    res.json(bookings); // Returns array directly
  } catch (error) {
    console.error('Error getting tutor bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - tutorId
 *               - subject
 *               - scheduledDate
 *               - scheduledTime
 *               - duration
 *             properties:
 *               studentId:
 *                 type: string
 *               tutorId:
 *                 type: string
 *               subject:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *               scheduledTime:
 *                 type: string
 *               duration:
 *                 type: number
 */
router.post('/', async (req, res) => {
  try {
    // Validation
    const requiredFields = ['studentId', 'tutorId', 'subject', 'scheduledDate', 'scheduledTime', 'duration'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate duration
    if (req.body.duration <= 0) {
      return res.status(400).json({
        message: 'Duration must be greater than 0'
      });
    }

    // Validate date is not in the past (only for new bookings, not past ones)
    const scheduledDateTime = new Date(`${req.body.scheduledDate}T${req.body.scheduledTime}`);
    const now = new Date();
    
    // Allow creating past bookings if status is already set to 'completed'
    if (scheduledDateTime < now && req.body.status !== 'completed') {
      return res.status(400).json({
        message: 'Cannot book sessions in the past'
      });
    }

    const bookingData = {
      ...req.body,
      bookingId: req.body.bookingId || cryptoRandomId(),
      status: req.body.status || 'pending',
      createdAt: req.body.createdAt || new Date()
    };

    const newBooking = new Booking(bookingData);
    await newBooking.save();
    
    res.status(201).json(newBooking); // Returns booking object directly
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:bookingId', async (req, res) => {
  try {
    if (!req.params.bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json(booking); // Returns booking object directly
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:bookingId', async (req, res) => {
  try {
    if (!req.params.bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const result = await Booking.findOneAndDelete({ bookingId: req.params.bookingId });
    
    if (!result) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({ ok: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;