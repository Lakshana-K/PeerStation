import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// Helper function for generating IDs
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// GET all messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET messages by user (conversations)
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    });
    
    const conversations = {};
    
    messages.forEach((msg) => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const ids = [userId, otherUserId].sort();
      const convId = `conv_${ids[0]}_${ids[1]}`;
      
      if (!conversations[convId]) {
        conversations[convId] = [];
      }
      conversations[convId].push(msg);
    });
    
    Object.keys(conversations).forEach((convId) => {
      conversations[convId].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    });
    
    res.json(conversations);
  } catch (error) {
    console.error('Error getting user messages:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET conversation between two users
router.get('/conversation', async (req, res) => {
  try {
    const { userId1, userId2 } = req.query;
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ sentAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new message
router.post('/', async (req, res) => {
  try {
    const messageData = {
      ...req.body,
      messageId: req.body.messageId || cryptoRandomId(),
      sentAt: req.body.sentAt || new Date(),
      isRead: req.body.isRead ?? false
    };

    const newMessage = new Message(messageData);
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT mark message as read
router.put('/:messageId/read', async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { messageId: req.params.messageId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;