// ========================================
// FILE: server/server.js
// WITH SWAGGER UI DOCUMENTATION
// ========================================

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

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
// Swagger Configuration
// ========================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PeerStation API',
      version: '1.0.0',
      description: 'Peer-to-peer tutoring platform API documentation',
      contact: {
        name: 'PeerStation Team'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://peerstation-api.onrender.com'
          : 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    tags: [
      { name: 'Users', description: 'User management and authentication' },
      { name: 'Bookings', description: 'Tutoring session bookings' },
      { name: 'Reviews', description: 'Tutor reviews and ratings' },
      { name: 'Help Requests', description: 'Community help requests' },
      { name: 'Messages', description: 'User messaging system' },
      { name: 'Availability', description: 'Tutor availability slots' },
      { name: 'Notifications', description: 'User notifications' }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API routes
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PeerStation API Docs'
}));

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
    if (!origin) return callback(null, true);
    
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
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
// API Routes
// ========================================
app.use('/api/users', usersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/helprequests', helpRequestsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/notifications', notificationsRouter);

// Tutor stats route
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
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint - redirect to API docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 Allowed origins:`, allowedOrigins);
  console.log(`✅ Vercel wildcard enabled: *.vercel.app`);
  console.log(`📁 Routes loaded: users, bookings, reviews, helprequests, messages, availability, notifications`);
});