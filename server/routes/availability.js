import express from 'express';
import Availability from '../models/Availability.js';

const router = express.Router();

// Helper function for generating IDs
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// GET all availability slots
router.get('/', async (req, res) => {
  try {
    const slots = await Availability.find();
    res.json(slots);
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET availability by tutor
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const slots = await Availability.find({ tutorId: req.params.tutorId });
    res.json(slots);
  } catch (error) {
    console.error('Error getting tutor availability:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new availability slot
router.post('/', async (req, res) => {
  try {
    console.log('🔥 POST /api/availability - Received:', req.body);
    
    const slotData = {
      ...req.body,
      slotId: req.body.slotId || cryptoRandomId()
    };

    const newSlot = new Availability(slotData);
    await newSlot.save();
    
    console.log('✨ Created slot:', newSlot);
    res.status(201).json(newSlot);
  } catch (error) {
    console.error('Error creating availability:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE availability slot
router.delete('/:slotId', async (req, res) => {
  try {
    await Availability.findOneAndDelete({ slotId: req.params.slotId });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;