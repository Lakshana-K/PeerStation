import mongoose from 'mongoose';

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

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;