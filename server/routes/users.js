import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Helper function for generating IDs
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users); // Returns array directly
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    // Validation
    if (!req.body.name || !req.body.email) {
      return res.status(400).json({
        message: 'Name and email are required fields'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already registered'
      });
    }

    const userData = {
      ...req.body,
      userId: req.body.userId || cryptoRandomId(),
      createdAt: req.body.createdAt || new Date(),
      emailVerified: req.body.emailVerified ?? true,
      isActive: req.body.isActive ?? true
    };

    const newUser = new User(userData);
    await newUser.save();
    
    res.status(201).json(newUser); // Returns user object directly
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'User with this email or userId already exists'
      });
    }
    
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
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

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    res.json(user); // Returns user object directly
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user); // Returns user object directly
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;