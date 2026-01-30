import mongoose from 'mongoose';

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

const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);

export default HelpRequest;