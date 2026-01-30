import express from 'express';
import HelpRequest from '../models/HelpRequest.js';

const router = express.Router();

// Helper function for generating IDs
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// GET all help requests
router.get('/', async (req, res) => {
  try {
    const requests = await HelpRequest.find();
    res.json(requests);
  } catch (error) {
    console.error('Error getting help requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new help request
router.post('/', async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      requestId: req.body.requestId || cryptoRandomId()
    };

    const newRequest = new HelpRequest(requestData);
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating help request:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update help request
router.put('/:requestId', async (req, res) => {
  try {
    const request = await HelpRequest.findOneAndUpdate(
      { requestId: req.params.requestId },
      req.body,
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error updating help request:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE help request
router.delete('/:requestId', async (req, res) => {
  try {
    await HelpRequest.findOneAndDelete({ requestId: req.params.requestId });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting help request:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;