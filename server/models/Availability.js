import mongoose from 'mongoose';

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

const Availability = mongoose.model('Availability', availabilitySchema);

export default Availability;