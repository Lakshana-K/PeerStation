import mongoose from 'mongoose';

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

const User = mongoose.model('User', userSchema);

export default User;