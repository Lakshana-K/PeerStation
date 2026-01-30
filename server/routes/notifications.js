import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// Helper function for generating IDs
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// GET all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET notifications by user
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId });
    res.json(notifications);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new notification
router.post('/', async (req, res) => {
  try {
    const notifData = {
      ...req.body,
      notificationId: req.body.notificationId || cryptoRandomId()
    };

    const newNotif = new Notification(notifData);
    await newNotif.save();
    res.status(201).json(newNotif);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update notification
router.put('/:notificationId', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { notificationId: req.params.notificationId },
      req.body,
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT mark all notifications as read for a user
router.put('/user/:userId/mark-all-read', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.params.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({ success: true, count: result.modifiedCount });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const result = await Notification.findOneAndDelete({ 
      notificationId: req.params.notificationId 
    });
    
    if (!result) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json({ message: "Notification deleted", notificationId: req.params.notificationId });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;