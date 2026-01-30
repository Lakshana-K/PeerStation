import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Helper function for generating IDs
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    const userData = {
      ...req.body,
      userId: req.body.userId || cryptoRandomId(),
      createdAt: req.body.createdAt || new Date(),
      emailVerified: req.body.emailVerified ?? true,
      isActive: req.body.isActive ?? true
    };

    const newUser = new User(userData);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ message: error.message });
  }
});

// POST login
router.post('/login', async (req, res) => {
  try {
    console.log('\n🔍 ===== LOGIN ATTEMPT =====');
    console.log('📨 Request body:', req.body);
    
    const { email, password } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const user = await User.findOne({ email: email.trim() });
    
    console.log('✅ User found:', user ? 'YES - ' + user.name : 'NO');
    console.log('===== END LOGIN ATTEMPT =====\n');
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json(user);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;