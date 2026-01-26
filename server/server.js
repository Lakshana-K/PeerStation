import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the server directory
dotenv.config({ path: join(__dirname, '.env') });

/* =========================
   MongoDB Connection
========================= */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

/* =========================
   Helpers
========================= */
function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function ensureId(item, idField) {
  if (item[idField]) return item;
  return { ...item, [idField]: cryptoRandomId() };
}

/* =========================
   Schemas & Models
========================= */

// USERS
const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: String,
    email: { type: String, required: true },
    passwordHash: String,
    roles: [String],
    subjects: [String],
    educationLevel: String,
    institution: String,
    course: String,
    year: Number,
    gpa: Number,
    bio: String,
    profilePicture: String,
    createdAt: String,
    updatedAt: String,
    emailVerified: Boolean,
    isActive: Boolean,
  },
  { versionKey: false }
);
const User = mongoose.models.users || mongoose.model("users", userSchema);

// BOOKINGS
const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    studentId: String,
    tutorId: String,
    subject: String,
    specificTopic: String,
    scheduledDate: String,
    scheduledTime: String,
    scheduledDateTime: String,
    duration: String,
    format: String,
    location: String,
    status: String,
    additionalNotes: String,
    createdAt: String,
    confirmedAt: String,
    completedAt: String,
    cancelledAt: String,
  },
  { versionKey: false }
);
const Booking = mongoose.models.bookings || mongoose.model("bookings", bookingSchema);

// AVAILABILITY
const availabilitySchema = new mongoose.Schema(
  {
    slotId: { type: String, required: true, unique: true },
    tutorId: String,
    date: String,
    startTime: String,
    endTime: String,
    dayOfWeek: String,
    format: String,
    location: String,
  },
  { versionKey: false }
);
const Availability =
  mongoose.models.availability || mongoose.model("availability", availabilitySchema);

// HELP REQUESTS - ✅ FIXED: Changed from "helpRequests" to "helprequests"
const helpRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    studentId: String,
    studentName: String,
    subject: String,
    title: String,
    description: String,
    urgency: String,
    preferredFormat: String,
    status: String,
    claimedBy: String,
    expiresAt: String,
    createdAt: String,
  },
  { versionKey: false }
);
const HelpRequest =
  mongoose.models.helprequests || mongoose.model("helprequests", helpRequestSchema);

// MESSAGES
const messageSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, unique: true },
    senderId: String,
    receiverId: String,
    conversationId: String,
    content: String,
    sentAt: String,
    isRead: Boolean,
    readAt: String,
    attachments: [String],
  },
  { versionKey: false }
);
const Message = mongoose.models.messages || mongoose.model("messages", messageSchema);

// NOTIFICATIONS
const notificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, required: true, unique: true },
    userId: String,
    title: String,
    message: String,
    isRead: Boolean,
    readAt: String,
    createdAt: String,
  },
  { versionKey: false }
);
const Notification =
  mongoose.models.notifications || mongoose.model("notifications", notificationSchema);

// REVIEWS
const reviewSchema = new mongoose.Schema(
  {
    reviewId: { type: String, required: true, unique: true },
    tutorId: String,
    studentId: String,
    rating: Number,
    comment: String,
    createdAt: String,
    helpfulCount: { type: Number, default: 0 },
  },
  { versionKey: false }
);
const Review = mongoose.models.reviews || mongoose.model("reviews", reviewSchema);

// TUTOR STATS - ✅ FIXED: Changed from "tutorStats" to "tutorstats"
const tutorStatSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
const TutorStat =
  mongoose.models.tutorstats || mongoose.model("tutorstats", tutorStatSchema);

/* =========================
   ROUTES
========================= */

/* ---------- USERS ---------- */
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const newUser = ensureId(
      {
        ...req.body,
        createdAt: req.body.createdAt || new Date().toISOString(),
        emailVerified: req.body.emailVerified !== undefined ? req.body.emailVerified : true,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      },
      "userId"
    );
    const saved = await User.create(newUser);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate(
      { userId: req.params.id },
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- BOOKINGS ---------- */
app.get("/api/bookings", async (req, res) => {
  try {
    res.json(await Booking.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/bookings/student/:studentId", async (req, res) => {
  try {
    const bookings = await Booking.find({ studentId: req.params.studentId });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/bookings/tutor/:tutorId", async (req, res) => {
  try {
    const bookings = await Booking.find({ tutorId: req.params.tutorId });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const booking = ensureId({
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString(),
    }, "bookingId");
    res.status(201).json(await Booking.create(booking));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/bookings/:id", async (req, res) => {
  try {
    const updated = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Booking not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- AVAILABILITY ---------- */
app.get("/api/availability", async (req, res) => {
  try {
    res.json(await Availability.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/availability/tutor/:tutorId", async (req, res) => {
  try {
    const slots = await Availability.find({ tutorId: req.params.tutorId });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/availability", async (req, res) => {
  try {
    const slot = ensureId(req.body, "slotId");
    res.status(201).json(await Availability.create(slot));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/availability/:id", async (req, res) => {
  try {
    const deleted = await Availability.findOneAndDelete({ slotId: req.params.id });
    if (!deleted) return res.status(404).json({ message: "Slot not found" });
    res.json({ message: "Slot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- HELP REQUESTS ---------- */
app.get("/api/helprequests", async (req, res) => {
  try {
    res.json(await HelpRequest.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/helprequests/student/:studentId", async (req, res) => {
  try {
    const requests = await HelpRequest.find({ studentId: req.params.studentId });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/helprequests", async (req, res) => {
  try {
    const reqItem = ensureId({
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString(),
    }, "requestId");
    res.status(201).json(await HelpRequest.create(reqItem));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/helprequests/:id", async (req, res) => {
  try {
    const updated = await HelpRequest.findOneAndUpdate(
      { requestId: req.params.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/helprequests/:id", async (req, res) => {
  try {
    const deleted = await HelpRequest.findOneAndDelete({ requestId: req.params.id });
    if (!deleted) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- MESSAGES ---------- */
app.get("/api/messages", async (req, res) => {
  try {
    res.json(await Message.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get conversation between two users (query params)
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
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/messages/user/:userId", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.params.userId },
        { receiverId: req.params.userId }
      ]
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const msg = ensureId({
      ...req.body,
      sentAt: req.body.sentAt || new Date().toISOString(),
      isRead: req.body.isRead !== undefined ? req.body.isRead : false,
    }, "messageId");
    res.status(201).json(await Message.create(msg));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/messages/:id", async (req, res) => {
  try {
    const updated = await Message.findOneAndUpdate(
      { messageId: req.params.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Message not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
app.put("/api/messages/:id/read", async (req, res) => {
  try {
    const updated = await Message.findOneAndUpdate(
      { messageId: req.params.id },
      { isRead: true, readAt: new Date().toISOString() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Message not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- REVIEWS ---------- */
app.get("/api/reviews", async (req, res) => {
  try {
    res.json(await Review.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reviews/tutor/:tutorId", async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.params.tutorId });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reviews/student/:studentId", async (req, res) => {
  try {
    const reviews = await Review.find({ studentId: req.params.studentId });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    const review = ensureId({
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString(),
      helpfulCount: 0,
    }, "reviewId");
    res.status(201).json(await Review.create(review));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark review as helpful
app.put("/api/reviews/:id/helpful", async (req, res) => {
  try {
    const review = await Review.findOne({ reviewId: req.params.id });
    if (!review) return res.status(404).json({ message: "Review not found" });
    
    review.helpfulCount = (review.helpfulCount || 0) + 1;
    await review.save();
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- NOTIFICATIONS ---------- */
app.get("/api/notifications", async (req, res) => {
  try {
    res.json(await Notification.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/notifications/user/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/notifications", async (req, res) => {
  try {
    const notif = ensureId({
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString(),
      isRead: req.body.isRead !== undefined ? req.body.isRead : false,
    }, "notificationId");
    res.status(201).json(await Notification.create(notif));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/notifications/:id", async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { notificationId: req.params.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/notifications/:id", async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({ notificationId: req.params.id });
    if (!deleted) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------- TUTOR STATS ---------- */
app.get("/api/tutorstats", async (req, res) => {
  try {
    res.json(await TutorStat.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/tutorstats/:tutorId", async (req, res) => {
  try {
    const stats = await TutorStat.findOne({ tutorId: req.params.tutorId });
    if (!stats) {
      return res.json({
        tutorId: req.params.tutorId,
        totalSessions: 0,
        averageRating: 0,
        totalEarnings: 0
      });
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   ERROR HANDLERS
========================= */
// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: `Cannot ${req.method} ${req.url}`,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error'
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});