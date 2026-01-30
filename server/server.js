
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Import routes
import usersRouter from './routes/users.js';
import bookingsRouter from './routes/bookings.js';
import reviewsRouter from './routes/reviews.js';
import helpRequestsRouter from './routes/helprequests.js';
import messagesRouter from './routes/messages.js';
import availabilityRouter from './routes/availability.js';
import notificationsRouter from './routes/notifications.js';

dotenv.config();

const app = express();

// ========================================
// CORS Configuration
// ========================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Allow ALL Vercel deployments (main + preview)
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Check other allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
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
// API Routes - Organized by resource
// ========================================
app.use('/api/users', usersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/helprequests', helpRequestsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/notifications', notificationsRouter);

// Tutor stats route (placeholder)
app.get("/api/tutorstats", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Error getting tutor stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Bind to all interfaces for Render

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed origins:`, allowedOrigins);
  console.log(`✅ Vercel wildcard enabled: *.vercel.app`);
  console.log(`📁 Routes loaded: users, bookings, reviews, helprequests, messages, availability, notifications`);
});