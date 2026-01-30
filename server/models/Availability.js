import mongoose from 'mongoose';

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

const Message = mongoose.model('Message', messageSchema);

export default Message;