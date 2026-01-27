// ========================================
// FILE: server/server.js
// FIXED: Now supports all Vercel preview URL
// ========================================

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ========================================
// CORS Configuration
// ========================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://peer-station.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Function to check if origin is a Vercel deployment
const isVercelDeployment = (origin) => {
  if (!origin) return false;
  return origin.includes('.vercel.app');
};

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowedOrigins OR is a Vercel deployment
    if (allowedOrigins.indexOf(origin) !== -1 || isVercelDeployment(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true })); 

// ========================================
// MongoDB Connection
// ========================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutoring';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ========================================
// MongoDB Schemas
// ========================================

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  role: String,
  roles: [String],
  profileImage: String,
  bio: String,
  subjects: [String],
  educationLevel: String,
  hourlyRate: Number,
  totalHours: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  emailVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { strict: false });

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

const reviewSchema = new mongoose.Schema({
  reviewId: { type: String, required: true, unique: true },
  bookingId: String,
  studentId: { type: String, required: true },
  tutorId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const helpRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  studentId: String,
  studentName: String,
  subject: String,
  topic: String,
  description: String,
  urgency: String,
  preferredFormat: String,
  status: { type: String, default: 'open' },
  claimedBy: String,
  resolvedBy: String,
  resolvedAt: Date,
  responses: [{ type: mongoose.Schema.Types.Mixed }],
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  conversationId: String,
  content: String,
  attachments: [{ type: mongoose.Schema.Types.Mixed }],
  sentAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  readAt: Date
}, { strict: false });

const availabilitySchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true },
  tutorId: { type: String, required: true },
  date: String,
  dayOfWeek: String,
  startTime: String,
  endTime: String,
  format: String,
  location: String,
  isRecurring: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false }
}, { strict: false });

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: String,
  title: String,
  message: String,
  actionUrl: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

// Create Models
const User = mongoose.model('User', userSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Review = mongoose.model('Review', reviewSchema);
const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);
const Message = mongoose.model('Message', messageSchema);
const Availability = mongoose.model('Availability', availabilitySchema);
const Notification = mongoose.model('Notification', notificationSchema);

// ========================================
// Helper Functions
// ========================================
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// ========================================
// USERS ROUTES
// ========================================
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/users", async (req, res) => {
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

app.post("/api/users/login", async (req, res) => {
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

app.put("/api/users/:id", async (req, res) => {
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

// ========================================
// BOOKINGS ROUTES
// ========================================
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/bookings/student/:studentId", async (req, res) => {
  try {
    const bookings = await Booking.find({ studentId: req.params.studentId });
    res.json(bookings);
  } catch (error) {
    console.error('Error getting student bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/bookings/tutor/:tutorId", async (req, res) => {
  try {
    const bookings = await Booking.find({ tutorId: req.params.tutorId });
    res.json(bookings);
  } catch (error) {
    console.error('Error getting tutor bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/bookings", async (req, res) => {
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

app.put("/api/bookings/:bookingId", async (req, res) => {
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

app.delete("/api/bookings/:bookingId", async (req, res) => {
  try {
    await Booking.findOneAndDelete({ bookingId: req.params.bookingId });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// REVIEWS ROUTES
// ========================================
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reviews/tutor/:tutorId", async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.params.tutorId });
    res.json(reviews);
  } catch (error) {
    console.error('Error getting tutor reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    console.log('📝 Creating review with data:', req.body);
    
    const reviewData = {
      ...req.body,
      reviewId: req.body.reviewId || cryptoRandomId(),
      createdAt: req.body.createdAt || new Date()
    };

    const newReview = new Review(reviewData);
    await newReview.save();
    
    console.log('✅ Review created:', newReview);
    res.status(201).json(newReview);
  } catch (error) {
    console.error('❌ Error creating review:', error);
    res.status(400).json({ message: error.message });
  }
});

// ========================================
// HELP REQUESTS ROUTES
// ========================================
app.get("/api/helprequests", async (req, res) => {
  try {
    const requests = await HelpRequest.find();
    res.json(requests);
  } catch (error) {
    console.error('Error getting help requests:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/helprequests", async (req, res) => {
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

app.put("/api/helprequests/:requestId", async (req, res) => {
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

app.delete("/api/helprequests/:requestId", async (req, res) => {
  try {
    await HelpRequest.findOneAndDelete({ requestId: req.params.requestId });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting help request:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// MESSAGES ROUTES
// ========================================
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/messages/user/:userId", async (req, res) => {
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

app.get("/api/messages/conversation", async (req, res) => {
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

app.post("/api/messages", async (req, res) => {
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

app.put("/api/messages/:messageId/read", async (req, res) => {
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

// ========================================
// AVAILABILITY ROUTES
// ========================================
app.get("/api/availability", async (req, res) => {
  try {
    const slots = await Availability.find();
    res.json(slots);
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/availability/tutor/:tutorId", async (req, res) => {
  try {
    const slots = await Availability.find({ tutorId: req.params.tutorId });
    res.json(slots);
  } catch (error) {
    console.error('Error getting tutor availability:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/availability", async (req, res) => {
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

app.delete("/api/availability/:slotId", async (req, res) => {
  try {
    await Availability.findOneAndDelete({ slotId: req.params.slotId });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// NOTIFICATIONS ROUTES
// ========================================
app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/notifications/user/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId });
    res.json(notifications);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/notifications", async (req, res) => {
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

app.put("/api/notifications/:notificationId", async (req, res) => {
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

app.put("/api/notifications/user/:userId/mark-all-read", async (req, res) => {
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

app.delete("/api/notifications/:notificationId", async (req, res) => {
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

// ========================================
// TUTOR STATS ROUTES
// ========================================
app.get("/api/tutorstats", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Error getting tutor stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed origins:`, allowedOrigins);
});

